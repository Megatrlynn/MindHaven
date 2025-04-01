import React from "react";

const ContactUs = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Contact Us</h1>
      <p className="text-gray-600 mb-4">
        We’d love to hear from you! Fill out the form below or reach us directly.
      </p>

      <form className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium">Name</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Your Name"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Email</label>
          <input
            type="email"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Your Email"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Message</label>
          <textarea
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Your Message"
          ></textarea>
        </div>

        <button className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition">
          Send Message
        </button>
      </form>

      <div className="mt-6 text-gray-600">
        <p>Email: <a href="mailto:support@mindhaven.com" className="text-blue-600 underline">support@mindhaven.com</a></p>
        <p>Phone: +1 (555) 123-4567</p>
        <p>Address: 123 Wellness Street, Therapy City, MH 56789</p>
      </div>
    </div>
  );
};

export default ContactUs;
