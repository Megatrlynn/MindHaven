import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Question } from '../lib/types';
import { MessageCircle, Search, CalendarDays, BadgeCheck, HelpCircle } from 'lucide-react';
import Footer from '../components/Footer';
import { usePageSEO } from '../hooks/usePageSEO';

const FAQs = () => {
  usePageSEO({
    title: 'FAQs | MindHaven Mental Health Questions and Answers',
    description: 'Browse frequently asked mental health questions answered by professionals on MindHaven.',
    path: '/faqs',
  });

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
    <div className="w-full">
      <section className="content-shell py-8 lg:py-10">
        <div className="surface-card overflow-hidden border border-slate-200 bg-white">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="px-6 py-10 md:px-10 lg:px-12">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
                <MessageCircle className="h-3.5 w-3.5" />
                Community Knowledge Base
              </p>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Browse real patient questions and verified answers from the MindHaven support flow.
              </p>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-6 md:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search the FAQ feed</p>
                <div className="relative mt-3 flex items-center">
                  <Search
                    className={`absolute left-4 h-5 w-5 text-slate-400 ${isFocused ? 'animate-pulse' : ''} transition-all duration-300`}
                  />
                  <input
                    type="text"
                    placeholder="Search questions or answers..."
                    value={searchTerm}
                    onChange={handleSearch}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-slate-900 shadow-sm transition-all duration-200 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {filteredQuestions.length} result{filteredQuestions.length === 1 ? '' : 's'} found.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <div className="content-shell py-8">
        <div className="mx-auto w-full max-w-4xl">
        {/* Questions List */}
        <div className="space-y-5">
          {filteredQuestions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <p className="text-slate-600">
                {searchTerm.trim() === '' 
                  ? 'No answered questions yet.' 
                  : 'No questions match your search.'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <div 
                key={question.id} 
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="border-b border-slate-200 bg-slate-50/90 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Answered Question
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Asked on {new Date(question.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-[auto_1fr]">
                  <div className="flex items-start gap-3 md:flex-col md:items-center">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      User #{question.user_id.slice(0, 8)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question</p>
                      <p className="mt-2 text-base leading-7 text-slate-900">
                        {question.question}
                      </p>
                    </div>

                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-cyan-700" />
                        <p className="text-sm font-semibold text-cyan-900">Answer</p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {question.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FAQs;
