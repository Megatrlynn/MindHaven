import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Notebook as Robot, Video, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Review } from '../lib/types';

const Home = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const intervalRef = useRef<number>();

  useEffect(() => {
    loadReviews();

    // Start the auto-scroll
    intervalRef.current = window.setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [reviews.length]);

  const loadReviews = async () => {
    try {
      // First get all reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Then get user profiles for those reviews
      if (reviewsData && reviewsData.length > 0) {
        const userIds = reviewsData.map(review => review.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, name')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const reviewsWithProfiles = reviewsData.map(review => ({
          ...review,
          user_profile: profilesData?.find(profile => profile.user_id === review.user_id)
        }));

        setReviews(reviewsWithProfiles);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Your Health, Our Priority
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Connect with qualified doctors instantly through chat, voice, or video calls.
          Get the medical attention you need, when you need it.
        </p>
      </div>

      <div className="mt-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Connect with Doctors</h3>
                <p className="mt-5 text-base text-gray-500">
                  Choose from our network of verified medical professionals specializing in various fields.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                  <Robot className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">AI Assistance</h3>
                <p className="mt-5 text-base text-gray-500">
                  Get instant responses to basic medical queries through our AI-powered system.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Video Consultations</h3>
                <p className="mt-5 text-base text-gray-500">
                  Face-to-face consultations from the comfort of your home through secure video calls.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/chat"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Start Consultation
        </Link>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">What Our Users Say</h2>
          <div className="relative overflow-hidden" style={{ height: '200px' }}>
            <div
              className="transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentReviewIndex * 100}%)`,
              }}
            >
              <div className="absolute top-0 left-0 flex">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="w-full flex-shrink-0"
                    style={{ width: '100vw', maxWidth: '1280px' }}
                  >
                    <div className="bg-white rounded-lg shadow-lg p-6 mx-auto max-w-2xl">
                      <div className="flex items-center mb-4">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 italic mb-4">"{review.review_text}"</p>
                      <p className="text-sm font-medium text-gray-900">
                        - {review.user_profile?.name || 'Anonymous User'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-4 space-x-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentReviewIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentReviewIndex(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;