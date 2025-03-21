import React from 'react';
import { Shield, Clock, Heart } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          About MedConnect
        </h1>
        <p className="mt-4 text-xl text-gray-500">
          Revolutionizing healthcare through technology
        </p>
      </div>

      <div className="mt-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center">
              <Shield className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-center text-gray-900">Secure Platform</h3>
            <p className="mt-2 text-gray-500 text-center">
              End-to-end encrypted communications and HIPAA-compliant data storage
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center">
              <Clock className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-center text-gray-900">24/7 Availability</h3>
            <p className="mt-2 text-gray-500 text-center">
              Access to medical professionals and AI assistance around the clock
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center">
              <Heart className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-center text-gray-900">Quality Care</h3>
            <p className="mt-2 text-gray-500 text-center">
              Verified doctors and specialists committed to your well-being
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
                <p className="mt-4 text-gray-500">
                  To make quality healthcare accessible to everyone through innovative technology.
                  We believe in breaking down barriers to healthcare access and providing
                  convenient, reliable medical consultations whenever you need them.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Our Team</h3>
                <p className="mt-4 text-gray-500">
                  We're a dedicated team of healthcare professionals, technologists,
                  and innovators working together to transform the healthcare experience.
                  Our platform connects you with verified medical experts who are passionate
                  about providing the best possible care.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;