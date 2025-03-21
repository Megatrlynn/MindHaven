import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Question } from '../../lib/types';
import { MessageCircle, Loader2, Send, Clock, CheckCircle } from 'lucide-react';

const ManageFAQs = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          user_profiles (
            name,
            email
          )
        `)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId: string) => {
    if (!answer.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          answer: answer.trim(),
          status: 'answered'
        })
        .eq('id', questionId);

      if (error) throw error;
      
      setAnswer('');
      setAnswering(null);
      await loadQuestions();
    } catch (error) {
      console.error('Error answering question:', error);
      alert('Failed to save answer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const answeredQuestions = questions.filter(q => q.status === 'answered');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Manage FAQs</h2>
        <p className="text-gray-600">Answer user questions and manage FAQs</p>
      </div>

      <div className="space-y-8">
        {/* Pending Questions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-yellow-500" />
            Pending Questions ({pendingQuestions.length})
          </h3>
          <div className="space-y-4">
            {pendingQuestions.map((question) => (
              <div key={question.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      User #{question.user_id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-gray-600">{question.question}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      Asked on {new Date(question.created_at).toLocaleString()}
                    </p>

                    {answering === question.id ? (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={4}
                          placeholder="Type your answer..."
                        />
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setAnswering(null);
                              setAnswer('');
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAnswer(question.id)}
                            disabled={saving || !answer.trim()}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                          >
                            {saving ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <>
                                <Send className="w-5 h-5 mr-2" />
                                Submit Answer
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAnswering(question.id)}
                        className="mt-4 flex items-center px-4 py-2 text-blue-600 hover:text-blue-800"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Answer Question
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {pendingQuestions.length === 0 && (
              <p className="text-center text-gray-500 py-4">No pending questions</p>
            )}
          </div>
        </div>

        {/* Answered Questions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Answered Questions ({answeredQuestions.length})
          </h3>
          <div className="space-y-4">
            {answeredQuestions.map((question) => (
              <div key={question.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      User #{question.user_id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-gray-600">{question.question}</p>
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <p className="font-medium text-gray-900">Answer:</p>
                      <p className="mt-1 text-gray-600">{question.answer}</p>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Asked on {new Date(question.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {answeredQuestions.length === 0 && (
              <p className="text-center text-gray-500 py-4">No answered questions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageFAQs;