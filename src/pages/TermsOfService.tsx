import React from "react";
import Footer from "../components/Footer";

const TermsOfService = () => {
  return (
    <div className="max-w-full mx-auto px-0 sm:px-0 lg:px-0">
        <div 
        className="relative bg-cover bg-center bg-no-repeat h-[600px] flex items-center justify-center text-center"
        style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1505243542579-da5adfe8338f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        backgroundColor: '#e5e7eb' 
        }}
    >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div> 
            <div className="relative z-10 px-6">
            <h1 className="text-4xl font-bold text-blue-600 sm:text-5xl md:text-6xl">
                Terms of Service
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-white sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                By using MindHaven, you agree to the following terms and conditions.
            </p>
            </div>
        </div> 

        <div className="max-w-3xl mx-auto p-6">
            {/* Section 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                <h2 className="text-xl font-semibold text-blue-600">Service Overview</h2>
                <div className="bg-blue-50 p-4 mt-2 rounded-md shadow-sm">
                <p className="text-gray-600">
                    MindHaven provides online therapy and mental wellness services to support your well-being.
                </p>
                </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                <h2 className="text-xl font-semibold text-blue-600">User Responsibilities</h2>
                <div className="bg-blue-50 p-4 mt-2 rounded-md shadow-sm">
                <p className="text-gray-600">
                    Users must provide accurate information and use the platform responsibly.
                </p>
                </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                <h2 className="text-xl font-semibold text-blue-600">Account Termination</h2>
                <div className="bg-blue-50 p-4 mt-2 rounded-md shadow-sm">
                <p className="text-gray-600">
                    We reserve the right to suspend or terminate accounts that violate our policies.
                </p>
                </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-blue-600">Contact Us</h2>
                <div className="bg-blue-50 p-4 mt-2 rounded-md shadow-sm">
                <p className="text-gray-600">
                    If you have any questions about our terms, email us at{" "}
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

export default TermsOfService;
