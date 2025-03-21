import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Question } from '../lib/types';
import { MessageCircle, Loader2 } from 'lucide-react';

const FAQs = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnsweredQuestions();
  }, []);

  const loadAnsweredQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          user_profiles (
            user_id
          )
        `)
        .eq('status', 'answered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="mt-2 text-gray-600">
          Questions and answers from our community
        </p>
      </div>

      <div className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No answered questions yet.</p>
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="font-medium text-gray-900">
                      User #{question.user_id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-gray-600">{question.question}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      Asked on {new Date(question.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="font-medium text-blue-900">Answer:</p>
                    <p className="mt-1 text-gray-800">{question.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FAQs;