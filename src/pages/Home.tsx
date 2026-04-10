import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Notebook as Robot, Video, Star, MessageCircle, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
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
    if (filteredArticles.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredArticles.length);
    }, 30000); 

    return () => clearInterval(interval); 
  }, [filteredArticles]);

  const toggleReadMore = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  const handleNext = () => {
    if (filteredArticles.length === 0) return;

    if (selectedCategory === "All") {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % articles.length);
    } else {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredArticles.length);
    }
  };

  const handlePrevious = () => {
    if (filteredArticles.length === 0) return;

    if (selectedCategory === "All") {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? articles.length - 1 : prevIndex - 1));
    } else {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? filteredArticles.length - 1 : prevIndex - 1));
    }
  };

  const getVisibleArticles = (list: HealthArticle[], start: number, count: number) => {
    if (list.length === 0) return [];

    const visible: HealthArticle[] = [];
    for (let i = 0; i < Math.min(count, list.length); i += 1) {
      visible.push(list[(start + i) % list.length]);
    }
    return visible;
  };

  const visibleArticles = getVisibleArticles(filteredArticles, currentIndex, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <section className="content-shell py-8 lg:py-10">
        <div className="surface-card overflow-hidden border border-slate-200 bg-white">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative px-6 py-10 md:px-10 lg:px-12">
              <div className="absolute right-8 top-8 h-32 w-32 rounded-full border border-cyan-100 bg-cyan-50/80"></div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                Modern Mental Wellness Hub
              </p>
              <h1 className="relative mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Your Mental Health, Our Priority
              </h1>
              <p className="relative mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Connect with verified therapists, continue secure conversations, and get immediate AI support in one intentional care workspace.
              </p>

              <div className="relative mt-8 flex flex-wrap gap-3">
                {userDomain !== 'admin' && userDomain !== 'doc' && (
                  <Link to="/chat" className="btn-primary text-base">
                    <MessageCircle className="h-5 w-5" />
                    Start Consultation
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                )}
                <Link to="/about" className="btn-subtle text-base">
                  Learn More
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-6 md:p-8 lg:border-l lg:border-t-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
                      <Users className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Verified Therapists</p>
                      <p className="text-xs text-slate-500">Trusted professionals on demand</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
                      <Robot className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">AI Support</p>
                      <p className="text-xs text-slate-500">Always-on emotional guidance</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
                      <Video className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Secure Sessions</p>
                      <p className="text-xs text-slate-500">Private chat and voice conversation flow</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-shell mt-10">
        <div className="surface-card border border-slate-200 bg-white p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: '1. Start Securely', desc: 'Sign in and set your care goals in minutes.' },
              { title: '2. Match & Connect', desc: 'Choose a therapist and begin secure conversations.' },
              { title: '3. Stay Supported', desc: 'Use AI support and follow up with your therapist anytime.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="content-shell mt-14">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
              <Star className="h-3.5 w-3.5" />
              Patient Voices
            </p>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900">What Our Users Say</h2>
              <p className="mt-2 text-sm text-slate-600">Real experiences from people building healthier routines with MindHaven.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentReviewIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-700 hover:text-white"
                aria-label="Previous review"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-700 hover:text-white"
                aria-label="Next review"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative mx-auto max-w-4xl overflow-hidden">
            <div
              className="mb-5 flex transition-transform duration-700 ease-in-out"
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
                  <div className="surface-card mx-4 border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                      <div>
                        <Quote className="h-7 w-7 text-cyan-700" />
                        <p className="mt-3 text-base leading-8 text-slate-700 md:text-lg">
                          {review.review_text}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:min-w-[210px]">
                        <div className="mb-3 flex items-center gap-3">
                      {review.user_profile?.profile_picture && (
                        <img
                          src={review.user_profile.profile_picture}
                                alt={review.user_profile?.name || 'User'}
                          className="h-14 w-14 rounded-full border-2 border-cyan-100 object-cover"
                        />
                      )}

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                          {review.user_profile?.name || "Anonymous User"}
                        </p>
                            <p className="text-xs text-slate-500">MindHaven user</p>
                          </div>
                        </div>

                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < review.rating ? 'fill-current text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
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
        </section>
      )}

      <section className="content-shell mt-14">
        <div className="mb-6 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
            <Robot className="h-3.5 w-3.5" />
            Knowledge Feed
          </p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Health Articles</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">Curated insights and practical guidance you can apply right away.</p>
        </div>

        <div className="mb-3 flex flex-wrap justify-center gap-3">
          {["All", ...categories].map((category) => (
            <button
              key={category}
              className={`rounded-full border px-5 py-2 font-medium transition duration-300 
              ${selectedCategory === category 
                ? 'scale-105 border-transparent bg-cyan-700 text-white shadow-lg' 
                : 'border-slate-300 bg-white text-slate-700 hover:bg-cyan-50 hover:text-cyan-900'
              }`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6">
          {visibleArticles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No articles yet in this category.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleArticles.map((article) => (
                <article key={article.id} className="surface-card overflow-hidden border border-slate-200 bg-white p-0 shadow-sm">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{article.category}</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-900">{article.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {expanded === article.id ? article.content : article.excerpt}
                    </p>
                    <button
                      className="mt-3 text-sm font-semibold text-cyan-700 hover:text-cyan-900"
                      onClick={() => toggleReadMore(article.id)}
                    >
                      {expanded === article.id ? 'Read Less' : 'Read More'}
                    </button>
                </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {filteredArticles.length > 1 && (
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              onClick={handlePrevious}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-700 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-cyan-300 hover:bg-cyan-700 hover:text-white"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      <section className="mt-16 bg-slate-100 py-12">
        <div className="content-shell text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-slate-900">Building Trust as we expand</h2>
          <p className="mb-8 text-slate-600">
            We will be having partnership with leading hospitals, verified doctors, and accredited health institutions.
          </p>

          {/* Logos */}
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center">
              <img src={hospitalImg} alt="Hospital" className="h-16" />
              <p className="mt-2 text-sm text-slate-500">Coming soon</p>
            </div>

            <div className="flex flex-col items-center">
              <img src={verifiedDocImg} alt="Verified Doctors" className="h-16" />
              <p className="mt-2 text-sm text-slate-500">Coming soon</p>
            </div>

            <div className="flex flex-col items-center">
              <img src={certifiedImg} alt="Certified" className="h-16" />
              <p className="mt-2 text-sm text-slate-500">Coming soon</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-8 py-4 text-cyan-900 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-cyan-700" />
            <span className="text-lg font-semibold">Trusted by a few users as we progress so far</span>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
};

export default Home;