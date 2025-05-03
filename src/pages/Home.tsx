import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Notebook as Robot, Video, Star, MessageCircle, ArrowRight, ArrowBigLeftDash, ArrowBigRightDash, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Review } from '../lib/types';
import Footer from "../components/Footer";
import hospitalImg from "../assets/partners/hospital.png";
import verifiedDocImg from "../assets/partners/verified_doctor.png";
import certifiedImg from "../assets/partners/certified.png";

interface HealthArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  category: string;
  created_at: string;
}

const Home = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const intervalRef = useRef<number>();
  const [userDomain, setUserDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [articles, setArticles] = useState<HealthArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  // const intervalRef = useRef(null);
  
  useEffect(() => {
    loadReviews();

    if (autoScrollEnabled && reviews.length > 0) {
      intervalRef.current = window.setInterval(() => {
        setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
      }, 10000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoScrollEnabled, reviews.length]);

  const loadReviews = async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
  
      if (reviewsError) throw reviewsError;
  
      if (reviewsData.length > 0) {
        const userIds = reviewsData.map(review => review.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, name, profile_picture')
          .in('user_id', userIds);
  
        if (profilesError) console.error('Error fetching profiles:', profilesError);
  
        const reviewsWithProfiles = reviewsData.map(review => ({
          ...review,
          user_profile: profilesData?.find(profile => profile.user_id === review.user_id) || null
        }));
  
        setReviews(reviewsWithProfiles);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };
  
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const emailParts = user.email?.split('@');
        if (emailParts?.length === 2) {
          const domain = emailParts[1].split('.')[0];
          setUserDomain(domain);
        }
      }

      setLoading(false); 
    };

    fetchUser();
  }, []);

  const filteredArticles =
    selectedCategory === "All"
      ? articles
      : articles.filter((article) => article.category === selectedCategory);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentIndex(0); 
  };

  const fetchArticles = async () => {
    const { data, error } = await supabase.from("health_articles").select("*");

    if (data && !error) {
      setArticles(data as HealthArticle[]);
      const uniqueCategories = [...new Set(data.map((a) => a.category))];
      setCategories(uniqueCategories);
    } else {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchArticles();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchArticles(); 
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredArticles.length);
    }, 30000); 

    return () => clearInterval(interval); 
  }, [filteredArticles]);

  const toggleReadMore = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  {filteredArticles.map((article) => (
    <div key={article.id} className="bg-white rounded-lg shadow-lg p-6 mx-auto">
      <img
        src={article.image_url}
        alt={article.title}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-semibold">{article.title}</h3>
      <p className="text-gray-600 mt-2">
        {expanded === article.id ? article.content : article.excerpt}
      </p>
      <button
        className="mt-4 text-blue-600 hover:underline"
        onClick={() => toggleReadMore(article.id)}
      >
        {expanded === article.id ? "Read Less" : "Read More"}
      </button>
    </div>
  ))}  

  const handleNext = () => {
    if (selectedCategory === "All") {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? articles.length - 1 : prevIndex - 1));
    } else {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? filteredArticles.length - 1 : prevIndex - 1));
    }
  };

  const handlePrevious = () => {
    if (selectedCategory === "All") {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? articles.length - 1 : prevIndex - 1));
    } else {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? filteredArticles.length - 1 : prevIndex - 1));
    }
  };

  const services = [
    {
      title: "Connect with Therapists",
      description: "Choose from our network of verified medical professionals specializing in various fields. Connect instantly!",
      imgSrc: "https://images.unsplash.com/photo-1666214280465-a40313304801?q=80&w=2070&auto=format&fit=crop",
      icon: Users
    },
    {
      title: "AI Assistance",
      description: "Get instant responses to basic medical queries through our AI-powered system, anytime and anywhere!",
      imgSrc: "https://images.unsplash.com/photo-1694903110330-cc64b7e1d21d?q=80&w=1932&auto=format&fit=crop",
      icon: Robot
    },
    {
      title: "Health Tracking",
      description: "Track your health metrics over time with intuitive graphs and receive helpful insights.",
      imgSrc: "https://plus.unsplash.com/premium_photo-1712762000585-8f304c444a78?q=80&w=2070&auto=format&fit=crop",
      icon: Video
    },
    {
      title: "Emergency Services",
      description: "Get immediate medical attention with emergency services available at your fingertips!",
      imgSrc: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2069&auto=format&fit=crop",
      icon: AlertCircle
    }
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-0 sm:px-0 lg:px-0 h-screen">
      <div 
        className="relative bg-cover bg-center bg-no-repeat h-[600px] flex items-center justify-center text-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1625134673337-519d4d10b313?q=80&w=2138&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          backgroundColor: '#e5e7eb' 
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 px-6">
          <h1 className="text-4xl font-bold text-blue-600 sm:text-5xl md:text-6xl">
            Your Mental Health, Our Priority
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-white sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Connect with qualified therapists instantly through chat, voice, or through AI assistance.
            Get the medical attention you need, when you need it.
          </p>
        </div>
      </div>

      <div className="mt-16 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Service Card Component */}
          {services.map(({ title, description, imgSrc, icon: Icon }, index) => (
            <div key={index} className="relative bg-gradient-to-b from-white to-gray-100 rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-[1.03] hover:shadow-2xl">
              <img 
                className="w-full h-[300px] object-cover"
                src={imgSrc}
                alt={title}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-blue-600/80 text-white rounded-t-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className="h-6 w-6 text-white drop-shadow-lg" />
                  <h3 className="text-lg font-semibold drop-shadow-lg">{title}</h3>
                </div>
                <p className="text-sm text-gray-100">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        {userDomain !== "admin" && userDomain !== "doc" && (
          <Link
            to="/chat"
            className="inline-flex items-center gap-3 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md border border-transparent 
                      transition-all duration-300 ease-in-out transform hover:bg-blue-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 "
          >
            <MessageCircle className="w-5 h-5 text-white animate-bounce" />
            Start Consultation
            <ArrowRight className="w-5 h-5 text-white transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">What Our Users Say</h2>

          {/* Carousel Wrapper */}
          <div className="relative overflow-hidden max-w-3xl mx-auto">
            <div
              className="flex transition-transform duration-700  mb-5 ease-in-out"
              style={{
                transform: `translateX(-${currentReviewIndex * 100}%)`,
              }}
            >
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex-shrink-0 w-full"
                  style={{ width: "100%" }}
                >
                  <div className="bg-white rounded-lg shadow-lg p-6 mx-auto max-w-2xl ml-4 mr-4">
                    
                    {/* Profile & Name Section */}
                    <div className="flex items-center mb-4">
                      {/* User Profile Image */}
                      {review.user_profile?.profile_picture && (
                        <img
                          src={review.user_profile.profile_picture}
                          className="w-[100px] h-[100px] rounded-full border-2 border-blue-500"
                        />
                      )}
                      
                      {/* Name & Rating */}
                      <div className="ml-4">
                        <p className="text-lg font-medium text-gray-900">
                          {review.user_profile?.name || "Anonymous User"}
                        </p>
                        
                        {/* Rating Stars */}
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Review Text */}
                    <p className="text-gray-600 italic">
                      "{review.review_text}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-4 space-x-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentReviewIndex ? "bg-blue-600 scale-125" : "bg-gray-300"
                }`}
                onClick={() => setCurrentReviewIndex(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* <div className="max-w-7xl mx-auto px-4 py-8 mt-10"> */}
        <h2 className="text-2xl font-bold text-center mb-2 mt-[60px]">Health Articles</h2>
        {/* Category Filter Buttons */}
        <div className="flex justify-center flex-wrap gap-3 mb-1">
          {["All", ...categories].map((category) => (
            <button
              key={category}
              className={`px-5 py-2 rounded-full transition duration-300 font-medium shadow-md border border-gray-300 
              ${selectedCategory === category 
                ? "bg-blue-600 text-white shadow-lg scale-105 border-transparent" 
                : "bg-white text-gray-700 hover:bg-blue-100 hover:shadow-md"
              }`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Article Carousel */}
        <div className="relative overflow-hidden ml-4 mr-4">
          <div
            className="flex transition-opacity duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`, 
            }}
          >
            {filteredArticles.map((article, index) => (
              <div
                key={article.id}
                className="flex-shrink-0 w-full bg-white rounded-lg shadow-lg p-6 mx-auto"
              >
                <div className="relative">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-[500px] object-cover rounded-md"
                  />
                  <div className="absolute rounded-lg bottom-0 left-0 w-full bg-black bg-opacity-50 text-white p-4">
                    <h3 className="text-lg font-semibold">{article.title}</h3>
                    <p className="text-gray-300 mt-2">
                      {expanded === article.id ? article.content : article.excerpt}
                    </p>
                    <button
                      className="mt-4 text-blue-600 hover:underline"
                      onClick={() => toggleReadMore(article.id)}
                    >
                      {expanded === article.id ? "Read Less" : "Read More"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredArticles.length > 1 && (
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={handlePrevious}
              className="p-3 bg-white/30 backdrop-blur-md text-blue-600 rounded-full flex items-center justify-center transition-all duration-300 shadow-md 
              hover:bg-blue-600 hover:text-white hover:shadow-lg active:scale-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <ArrowBigLeftDash className="text-2xl" />
            </button>
            <button
              onClick={handleNext}
              className="p-3 bg-white/30 backdrop-blur-md text-blue-600 rounded-full flex items-center justify-center transition-all duration-300 shadow-md 
              hover:bg-blue-600 hover:text-white hover:shadow-lg active:scale-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <ArrowBigRightDash className="text-2xl" />
            </button>
          </div>
        )}
        {/* </div> */}

      <div className="bg-gray-100 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-6">Building Trust as we expand</h2>
          <p className="text-gray-600 mb-8">
            We will be having partnership with leading hospitals, verified doctors, and accredited health institutions.
          </p>

          {/* Logos */}
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center">
              <img src={hospitalImg} alt="Hospital" className="h-16" />
              <p className="text-gray-500 text-sm mt-2">Coming soon</p>
            </div>

            <div className="flex flex-col items-center">
              <img src={verifiedDocImg} alt="Verified Doctors" className="h-16" />
              <p className="text-gray-500 text-sm mt-2">Coming soon</p>
            </div>

            <div className="flex flex-col items-center">
              <img src={certifiedImg} alt="Certified" className="h-16" />
              <p className="text-gray-500 text-sm mt-2">Coming soon</p>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="mt-8 bg-blue-100 text-blue-900 py-4 px-8 rounded-lg shadow-md flex items-center justify-center gap-3 border border-blue-300">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">Trusted by a few users as we progress so far</span>
          </div>
        </div>
      </div>

      <Footer />

    </div>
  );
};

export default Home;