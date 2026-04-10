import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Question } from '../../lib/types';
import { MessageCircle, Loader2, Send, Clock, CheckCircle, HelpCircle } from 'lucide-react';

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
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">FAQs Management</h2>
        <p className="mt-1 text-sm text-slate-600">Respond to user questions and keep community answers up to date.</p>
      </div>

      <div className="space-y-8">
        {/* Pending Questions */}
        <div className="surface-card p-5">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-slate-900">
            <Clock className="mr-2 h-5 w-5 text-amber-600" />
            Pending Questions ({pendingQuestions.length})
          </h3>
          <div className="space-y-4">
            {pendingQuestions.map((question) => (
              <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <HelpCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      User #{question.user_id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-slate-600">{question.question}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Asked on {new Date(question.created_at).toLocaleString()}
                    </p>

                    {answering === question.id ? (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                          rows={4}
                          placeholder="Type your answer..."
                        />
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setAnswering(null);
                              setAnswer('');
                            }}
                            className="btn-subtle"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAnswer(question.id)}
                            disabled={saving || !answer.trim()}
                            className="btn-primary disabled:opacity-60"
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
                        className="mt-4 inline-flex items-center rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-cyan-800 transition-colors hover:bg-cyan-100"
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
              <p className="py-4 text-center text-slate-500">No pending questions</p>
            )}
          </div>
        </div>

        {/* Answered Questions */}
        <div className="surface-card p-5">
          <h3 className="mb-4 flex items-center text-lg font-semibold text-slate-900">
            <CheckCircle className="mr-2 h-5 w-5 text-emerald-600" />
            Answered Questions ({answeredQuestions.length})
          </h3>
          <div className="space-y-4">
            {answeredQuestions.map((question) => (
              <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <MessageCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">
                      User #{question.user_id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-slate-600">{question.question}</p>
                    <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                      <p className="font-medium text-emerald-900">Answer:</p>
                      <p className="mt-1 text-emerald-800">{question.answer}</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Asked on {new Date(question.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {answeredQuestions.length === 0 && (
              <p className="py-4 text-center text-slate-500">No answered questions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageFAQs;