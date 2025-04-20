import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Brain, LogIn, Menu, X, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserRole } from '../lib/auth';

const Navbar = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  

  const handleClick = async () => {
    setLoading(true);
    try {
      await handleSignOut();
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    checkUserRole();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const role = await getUserRole();
        setUserRole(role);
      } else {
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const hideButton = location.pathname === "/login" || location.pathname === "/patient-login";
  const hideSignInButton = !userRole && location.pathname === "/chat";

  const renderNavLinks = () => {
    if (userRole === 'admin') {
      return (
        <Link
          to="/admin"
          className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative group ${
            isActive('/admin')
              ? 'text-blue-600'
              : 'text-gray-900 hover:text-blue-600'
          }`}
        >
          Dashboard
          {isActive('/admin') && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-pulse" />
          )}
        </Link>
      );
    }

    if (userRole === 'doctor') {
      return (
        <Link
          to="/doctor"
          className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative group ${
            isActive('/doctor')
              ? 'text-blue-600'
              : 'text-gray-900 hover:text-blue-600'
          }`}
        >
          Dashboard
          {isActive('/doctor') && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-pulse" />
          )}
        </Link>
      );
    }

    return (
      <>
        <Link
          to="/"
          className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative group ${
            isActive('/')
              ? 'text-blue-600'
              : 'text-gray-900 hover:text-blue-600'
          }`}
        >
          Home
          {isActive('/') && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-pulse" />
          )}
        </Link>
        <Link
          to="/about"
          className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative group ${
            isActive('/about')
              ? 'text-blue-600'
              : 'text-gray-900 hover:text-blue-600'
          }`}
        >
          About
          {isActive('/about') && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-pulse" />
          )}
        </Link>
        <Link
          to="/faqs"
          className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative group ${
            isActive('/faqs')
              ? 'text-blue-600'
              : 'text-gray-900 hover:text-blue-600'
          }`}
        >
          FAQs
          {isActive('/faqs') && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-pulse" />
          )}
        </Link>
        <Link
          to="/chat"
          className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative group ${
            isActive('/chat')
              ? 'text-blue-600'
              : 'text-gray-900 hover:text-blue-600'
          }`}
        >
          Chat
          {isActive('/chat') && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-pulse" />
          )}
        </Link>
        {userRole === 'patient' && (
          <Link
            to="/profile"
            className={`inline-flex items-center px-1 pt-1 text-sm font-medium relative group ${
              isActive('/profile')
                ? 'text-blue-600'
                : 'text-gray-900 hover:text-blue-600'
            }`}
          >
            Profile
            {isActive('/profile') && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 animate-pulse" />
            )}
          </Link>
        )}
      </>
    );
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">MindHaven</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {renderNavLinks()}
            </div>
          </div>
          <div className="flex items-center">
            {!isLoading && !hideButton &&(
              userRole ? (
                <button
                  onClick={handleClick}
                  disabled={loading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                  ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {loading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <LogOut className="h-5 w-5 mr-2" />}
                  {loading ? "Signing Out..." : "Sign Out"}
                </button>
              ) : (
                !hideSignInButton && (
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </button>
                )
              )
            )}
            <div className="sm:hidden ml-4">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          {userRole === 'admin' ? (
            <Link
              to="/admin"
              className={`block px-3 py-2 text-base font-medium ${
                isActive('/admin')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          ) : userRole === 'doctor' ? (
            <Link
              to="/doctor"
              className={`block px-3 py-2 text-base font-medium ${
                isActive('/doctor')
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/"
                className={`block px-3 py-2 text-base font-medium ${
                  isActive('/')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`block px-3 py-2 text-base font-medium ${
                  isActive('/about')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/faqs"
                className={`block px-3 py-2 text-base font-medium ${
                  isActive('/faqs')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                FAQs
              </Link>
              <Link
                to="/chat"
                className={`block px-3 py-2 text-base font-medium ${
                  isActive('/chat')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Chat
              </Link>
              {userRole === 'patient' && (
                <Link
                  to="/profile"
                  className={`block px-3 py-2 text-base font-medium ${
                    isActive('/profile')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;