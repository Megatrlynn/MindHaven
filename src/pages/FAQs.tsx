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
      <div className="flex h-screen items-center justify-center bg-[var(--mh-surface-soft)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <section className="content-shell py-8 lg:py-10">
        <div className="surface-card overflow-hidden border border-[var(--mh-border)] bg-[var(--mh-surface)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="px-6 py-10 md:px-10 lg:px-12">
              <p className="inline-flex items-center gap-2 rounded-full border border-[var(--mh-accent-border)] bg-[var(--mh-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--mh-accent-text)]">
                <MessageCircle className="h-3.5 w-3.5" />
                Community Knowledge Base
              </p>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[var(--mh-text)] sm:text-5xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--mh-text-muted)] sm:text-lg">
                Browse real patient questions and verified answers from the MindHaven support flow.
              </p>
            </div>

            <div className="border-t border-[var(--mh-border)] bg-[var(--mh-surface-soft)] p-6 md:p-8 lg:border-l lg:border-t-0">
              <div className="rounded-2xl border border-[var(--mh-border)] bg-[var(--mh-surface)] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mh-text-muted)]">Search the FAQ feed</p>
                <div className="relative mt-3 flex items-center">
                  <Search
                    className={`absolute left-4 h-5 w-5 text-[var(--mh-text-muted)] ${isFocused ? 'animate-pulse' : ''} transition-all duration-300`}
                  />
                  <input
                    type="text"
                    placeholder="Search questions or answers..."
                    value={searchTerm}
                    onChange={handleSearch}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full rounded-xl border border-[var(--mh-border)] bg-[var(--mh-surface)] py-3 pl-12 pr-4 text-[var(--mh-text)] shadow-sm transition-all duration-200 placeholder:text-[var(--mh-text-muted)] focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
                <p className="mt-3 text-xs text-[var(--mh-text-muted)]">
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
            <div className="rounded-2xl border border-[var(--mh-border)] bg-[var(--mh-surface)] p-12 text-center shadow-sm">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-[var(--mh-text-muted)]" />
              <p className="text-[var(--mh-text-muted)]">
                {searchTerm.trim() === '' 
                  ? 'No answered questions yet.' 
                  : 'No questions match your search.'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <div 
                key={question.id} 
                className="group overflow-hidden rounded-2xl border border-[var(--mh-border)] bg-[var(--mh-surface)] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="border-b border-[var(--mh-border)] bg-[var(--mh-surface-soft)] px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mh-accent-border)] bg-[var(--mh-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--mh-accent-text)]">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Answered Question
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--mh-text-muted)]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Asked on {new Date(question.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-[auto_1fr]">
                  <div className="flex items-start gap-3 md:flex-col md:items-center">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--mh-accent-soft)] text-[var(--mh-accent-text)]">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <div className="rounded-xl border border-[var(--mh-border)] bg-[var(--mh-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--mh-text-muted)]">
                      User #{question.user_id.slice(0, 8)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mh-text-muted)]">Question</p>
                      <p className="mt-2 text-base leading-7 text-[var(--mh-text)]">
                        {question.question}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--mh-accent-border)] bg-[var(--mh-accent-soft)] p-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-[var(--mh-accent-text)]" />
                        <p className="text-sm font-semibold text-[var(--mh-accent-text)]">Answer</p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--mh-text-muted)]">
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
