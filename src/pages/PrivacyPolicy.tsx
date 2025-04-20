import React from "react";
import Footer from "../components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="max-w-full mx-auto px-0 sm:px-0 lg:px-0">
        <div 
        className="relative bg-cover bg-center bg-no-repeat h-[600px] flex items-center justify-center text-center"
        style={{
          backgroundImage: "url('https://plus.unsplash.com/premium_photo-1677093905956-bf103e4532f6?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
          backgroundColor: '#e5e7eb' 
        }}
        >
         <div className="absolute inset-0 bg-black bg-opacity-50"></div> 
            <div className="relative z-10 px-6">
            <h1 className="text-4xl font-bold text-blue-600 sm:text-5xl md:text-6xl">
                Privacy Policy
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-white sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Your privacy is important to us.
                This policy explains how we handle your data.
            </p>
            </div>
        </div> 

        <div className="max-w-3xl mx-auto p-6">
            {/* Section 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                <h2 className="text-xl font-semibold text-blue-600">Information We Collect</h2>
                <div className="bg-blue-50 p-4 mt-2 rounded-md shadow-sm">
                <p className="text-gray-600">
                    We collect personal information such as name, email, and health-related data to provide our services.
                </p>
                </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                <h2 className="text-xl font-semibold text-blue-600">How We Use Your Information</h2>
                <div className="bg-blue-50 p-4 mt-2 rounded-md shadow-sm">
                <p className="text-gray-600">
                    Your data is used to improve our services, provide therapy sessions, and ensure personalized care.
                </p>
                </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                <h2 className="text-xl font-semibold text-blue-600">Data Protection</h2>
                <div className="bg-blue-50 p-4 mt-2 rounded-md shadow-sm">
                <p className="text-gray-600">
                    We implement security measures to protect your personal information from unauthorized access.
                </p>
                </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-blue-600">Contact Us</h2>
                <div className="bg-blue-50 p-4 mt-2 rounded-md shadow-sm">
                <p className="text-gray-600">
                    If you have any questions about this privacy policy, contact us at{" "}
                    <a href="mailto:support@mindhaven.com" className="text-blue-600 underline font-semibold">
                    support@mindhaven.com
                    </a>.
                </p>
                </div>
            </div>
        </div>

        <Footer />

    </div>
  );
};

export default PrivacyPolicy;
