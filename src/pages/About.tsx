import React from 'react';
import { Shield, Clock, Heart, Brain } from 'lucide-react';
import Footer from '../components/Footer';

const About = () => {
  return (
    <div className="max-w-full mx-auto px-0 sm:px-0 lg:px-0">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat h-[600px] flex items-center justify-center text-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          backgroundColor: '#e5e7eb'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div> 
        <div className="relative z-10 px-6">
          <h1 className="text-4xl font-extrabold text-blue-600 sm:text-5xl md:text-6xl flex justify-center items-center w-full">
            <span className="mr-4">About</span>
            <span className="text-4xl font-extrabold text-blue-600 sm:text-5xl md:text-6xl flex items-center ml-2">
              <Brain className="h-24 w-24 text-blue-600 mr-2" />
              MindHaven
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-white sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Revolutionizing Mental healthcare through technology
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { icon: Shield, title: "Secure Platform", desc: "End-to-end encrypted communications and HIPAA-compliant data storage" },
              { icon: Clock, title: "24/7 Availability", desc: "Access to medical professionals and AI assistance around the clock" },
              { icon: Heart, title: "Quality Care", desc: "Verified doctors and specialists committed to your well-being" }
            ].map((feature, index) => (
              <div
                key={index}
                className="relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 overflow-hidden group transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex justify-center relative z-10">
                  <feature.icon className="h-14 w-14 text-white p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg" />
                </div>
                
                <h3 className="mt-5 text-xl font-semibold text-center text-gray-900 relative z-10">{feature.title}</h3>
                <p className="mt-3 text-gray-600 text-center relative z-10">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <div className="relative bg-white/80 backdrop-blur-xl shadow-xl border border-gray-200 rounded-2xl overflow-hidden px-8 py-12 md:px-12 md:py-16 transition-all duration-300 hover:shadow-2xl">
            
            {/* Floating Gradient Accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-blue-50 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              {/* Mission Section */}
              <div className="transform transition-transform duration-300 hover:scale-105">
                <h3 className="text-3xl font-extrabold text-gray-900">🌍 Our Mission</h3>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  To make quality healthcare accessible to everyone through innovative technology.
                  We believe in breaking down barriers to healthcare access and providing
                  convenient, reliable medical consultations whenever you need them.
                </p>
              </div>

              {/* Team Section */}
              <div className="transform transition-transform duration-300 hover:scale-105">
                <h3 className="text-3xl font-extrabold text-gray-900">👩‍⚕️ Our Team</h3>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  We're a dedicated team of healthcare professionals, technologists, 
                  and innovators working together to transform the healthcare experience.
                  Our platform connects you with verified medical experts passionate 
                  about providing the best possible care.
                </p>
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