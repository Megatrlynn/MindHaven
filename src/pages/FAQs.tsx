import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Question } from '../lib/types';
import { MessageCircle, Loader2, Search } from 'lucide-react';
import Footer from '../components/Footer';

const FAQs = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    loadAnsweredQuestions();
  }, []);

  const loadAnsweredQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('status', 'answered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
      setFilteredQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    if (value.trim() === '') {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter((q) => 
        q.question.toLowerCase().includes(value) || 
        (q.answer && q.answer.toLowerCase().includes(value)) 
      );      
      setFilteredQuestions(filtered);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-0 sm:px-0 lg:px-0">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat h-[600px] flex items-center justify-center text-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1606595898127-a06c52b4e2b3?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          backgroundColor: '#e5e7eb'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div> 
        <div className="relative z-10 px-6">
          <h1 className="text-4xl font-bold text-blue-600 sm:text-5xl md:text-6xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-white sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Questions and answers from our community
          </p>
        </div>
      </div> 

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="relative mb-6 w-full flex items-center">
          {/* Search Icon with Conditional Bounce Animation */}
          <Search
            className={`absolute left-4 text-gray-400 w-6 h-6 
            ${isFocused ? "animate-bounce" : ""} transition-all duration-300`}
          />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={handleSearch}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full shadow-sm bg-gray-100 
              focus:outline-none focus:ring-4 focus:ring-blue-400 focus:border-blue-500 
              transition-all duration-300 ease-in-out hover:bg-white"
            />
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12 bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">
                {searchTerm.trim() === '' 
                  ? 'No answered questions yet.' 
                  : 'No questions match your search.'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <div 
                key={question.id} 
                className="bg-white/80 rounded-xl shadow-lg border border-gray-200 p-6 transition-transform duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-start space-x-4">
                  
                  {/* Animated Icon */}
                  <div className="flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-blue-600 animate-bounce" />
                  </div>

                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
                      
                      {/* User Info */}
                      <p className="text-lg font-semibold text-gray-900">
                        User #{question.user_id.slice(0, 8)}
                      </p>

                      {/* Question */}
                      <p className="mt-2 text-gray-700 text-[1rem] leading-relaxed">
                        {question.question}
                      </p>

                      {/* Date */}
                      <p className="mt-2 text-xs text-gray-500">
                        Asked on {new Date(question.created_at).toLocaleDateString()}
                      </p>

                      {/* Answer Section */}
                      <div className="border-t border-gray-200 mt-4 pt-4">
                        <p className="font-semibold text-blue-900">Answer:</p>
                        <p className="mt-2 text-gray-800 leading-relaxed">
                          {question.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
      
      <Footer />
    </div>
  );
};

export default FAQs;
