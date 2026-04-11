import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Phone, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';
import Footer from '../components/Footer';

const ContactUs = () => {
  usePageSEO({
    title: 'Contact Us | MindHaven',
    description: 'Get in touch with the MindHaven team. We\'re here to help with any questions or feedback.',
    path: '/contact',
  });

  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus('idle');

    try {
      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        setSubmitStatus('error');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject || 'No subject',
        message: formData.message,
        status: 'new',
      });

      if (error) {
        console.error('Error submitting form:', error);
        setSubmitStatus('error');
      } else {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full">
        <section className="content-shell py-12 lg:py-16">
          <div className="text-center mb-12">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:text-cyan-200 mb-6">
              <Mail className="h-3.5 w-3.5" />
              Get in Touch
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">Contact Us</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Have questions or feedback? We'd love to hear from you. Reach out and we'll respond as soon as possible.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="surface-card p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Email</h3>
              <p className="text-slate-600 dark:text-slate-400"><a href="mailto:support@mindhaven.com" className="hover:text-cyan-700 dark:hover:text-cyan-300 transition">support@mindhaven.com</a></p>
            </div>
            <div className="surface-card p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Phone</h3>
              <p className="text-slate-600 dark:text-slate-400">+1 (555) 123-4567</p>
            </div>
            <div className="surface-card p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Address</h3>
              <p className="text-slate-600 dark:text-slate-400">123 Wellness Street, Therapy City, MH 56789</p>
            </div>
          </div>
        </section>

        <section className="content-shell mb-16">
          <div className="max-w-2xl mx-auto">
            <div className="surface-card p-8 md:p-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Send us a Message</h2>

              {submitStatus === 'success' && (
                <div className="mb-6 flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950 p-4 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <p>Thank you! Your message has been sent successfully. We'll get back to you soon.</p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-200">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>Please fill in all required fields (Name, Email, Message).</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition" placeholder="Your Full Name" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition" placeholder="your.email@example.com" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Subject</label>
                  <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition" placeholder="Subject (optional)" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Message <span className="text-red-500">*</span></label>
                  <textarea name="message" value={formData.message} onChange={handleChange} rows={6} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition resize-none" placeholder="Your message..." required></textarea>
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed py-3 text-base font-semibold">
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default ContactUs;
