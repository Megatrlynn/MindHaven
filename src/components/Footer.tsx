import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12 mt-16">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
      <div>
        <h3 className="text-lg font-semibold flex justify-center md:justify-start items-center">
          <span className="font-bold flex items-center">
            <Brain className="h-7 w-7 text-blue-500 mr-2 animate-pulse" />
            MindHaven
          </span>
        </h3>
        <p className="mt-3 text-gray-400 leading-relaxed">
          Connecting you with trusted doctors and health resources.
        </p>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Quick Links</h3>
        <ul className="mt-3 space-y-3">
          <li>
            <Link to="/privacy-policy" className="text-gray-400 hover:text-blue-400 transition duration-300">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link to="/terms-of-service" className="text-gray-400 hover:text-blue-400 transition duration-300">
              Terms of Service
            </Link>
          </li>
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Follow Us</h3>
        <div className="flex justify-center md:justify-start space-x-5 mt-3">
          <a href="#" className="text-gray-400 hover:text-blue-400 text-xl transition duration-300 hover:scale-110">
            <FaFacebookF />
          </a>
          <a href="#" className="text-gray-400 hover:text-blue-400 text-xl transition duration-300 hover:scale-110">
            <FaTwitter />
          </a>
          <a href="#" className="text-gray-400 hover:text-blue-400 text-xl transition duration-300 hover:scale-110">
            <FaLinkedinIn />
          </a>
          <a href="#" className="text-gray-400 hover:text-blue-400 text-xl transition duration-300 hover:scale-110">
            <FaInstagram />
          </a>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Contact Us</h3>
        <ul className="mt-3 space-y-3">
          <li>
            <p className="text-gray-400 transition duration-300 hover:text-blue-400">Phone: +250780000000</p>
          </li>
          <li>
            <p className="text-gray-400 transition duration-300 hover:text-blue-400">Email: support@mindhaven.com</p>
          </li>
        </ul>
      </div>
    </div>
    <div className="mt-10 border-t border-gray-700 opacity-50"></div>
    <p className="text-center text-gray-500 text-sm mt-6 flex justify-center items-center">
      &copy; {new Date().getFullYear()} 
      <span className="font-bold text-gray-400 flex items-center ml-2">
        <Brain className="h-5 w-5 text-blue-500 mr-2 animate-pulse" />
        MindHaven
      </span>
      . All rights reserved.
    </p>
  </div>
</footer>

  );
};

export default Footer;
