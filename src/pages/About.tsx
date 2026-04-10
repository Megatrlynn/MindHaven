import { Shield, Clock, Heart, Brain, Users, MessageCircle, CheckCircle2 } from 'lucide-react';
import Footer from '../components/Footer';
import { usePageSEO } from '../hooks/usePageSEO';

const About = () => {
  usePageSEO({
    title: 'About MindHaven | Trusted Digital Mental Health Care',
    description: 'Learn how MindHaven combines compassionate therapists and secure technology to deliver reliable mental health care.',
    path: '/about',
  });

  return (
    <div className="w-full">
      <section className="content-shell py-8 lg:py-10">
        <div className="surface-card overflow-hidden border border-slate-200 bg-white">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="px-6 py-10 md:px-10 lg:px-12">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
                <Brain className="h-3.5 w-3.5" />
                About MindHaven
              </p>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Care That Feels Human,
                <span className="block text-cyan-800">Powered by Smart Systems</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                We are building a modern mental health platform that blends clinical trust, thoughtful product design, and always-available digital support.
              </p>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-6 md:p-8 lg:border-l lg:border-t-0">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mission</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">Make quality mental healthcare easier to access for everyone.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vision</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">A secure, compassionate, and reliable care experience for every patient.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approach</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">Pair certified therapists with responsive technology that supports outcomes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="content-shell py-12">
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icon: Shield, title: "Secure Platform", desc: "End-to-end encrypted communications and HIPAA-compliant data storage" },
              { icon: Clock, title: "24/7 Availability", desc: "Access to medical professionals and AI assistance around the clock" },
              { icon: Heart, title: "Quality Care", desc: "Verified doctors and specialists committed to your well-being" }
            ].map((feature, index) => (
              <div
                key={index}
                className="surface-card surface-card-lift relative overflow-hidden rounded-2xl p-6"
              >
                <div className="absolute inset-0 bg-cyan-50 opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
                <div className="flex justify-center relative z-10">
                  <feature.icon className="h-14 w-14 rounded-full bg-cyan-700 p-3 text-white shadow-md" />
                </div>
                
                <h3 className="mt-5 text-xl font-semibold text-center text-gray-900 relative z-10">{feature.title}</h3>
                <p className="mt-3 text-gray-600 text-center relative z-10">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 space-y-8">
          <div className="surface-card rounded-2xl border border-slate-200 p-8 md:p-10">
            <div className="mb-8 text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
                <MessageCircle className="h-3.5 w-3.5" />
                Care Journey
              </p>
              <h3 className="mt-3 text-3xl font-extrabold text-slate-900">How MindHaven Works</h3>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Create Your Profile',
                  desc: 'Share essential details to personalize your care and ensure safer recommendations.',
                },
                {
                  step: '02',
                  title: 'Connect With Therapists',
                  desc: 'Browse available experts and start secure conversations when connections are approved.',
                },
                {
                  step: '03',
                  title: 'Stay Supported Daily',
                  desc: 'Use guided AI support and continuous therapist follow-up whenever you need help.',
                },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Step {item.step}</p>
                  <h4 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="surface-card rounded-2xl border border-slate-200 p-7">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
                  <Users className="h-5 w-5" />
                </span>
                <h4 className="text-2xl font-bold text-slate-900">Who We Support</h4>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-700" />
                  People looking for early emotional support and mental wellness guidance.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-700" />
                  Patients who need ongoing therapist conversations in a secure space.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-700" />
                  Users who prefer a hybrid care model with AI support plus expert follow-up.
                </li>
              </ul>
            </div>

            <div className="surface-card rounded-2xl border border-slate-200 p-7">
              <h4 className="text-2xl font-bold text-slate-900">Care Standards</h4>
              <div className="mt-5 space-y-4">
                {[
                  {
                    icon: Shield,
                    title: 'Privacy-First Infrastructure',
                    desc: 'Secure architecture designed to protect sensitive mental health conversations.',
                  },
                  {
                    icon: Clock,
                    title: 'Reliable Availability',
                    desc: 'Persistent access to support channels when users need them most.',
                  },
                  {
                    icon: Heart,
                    title: 'Compassionate Experience',
                    desc: 'A calmer, human-centered interface that reduces friction in care-seeking.',
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-cyan-700" />
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default About;