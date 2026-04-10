import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Brain, LogIn, Menu, X, LogOut, LayoutDashboard, MessageSquareText, UserRound, Moon, Sun } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserRole, isPatientProfileComplete } from '../lib/auth';

const Navbar = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPatientProfileCompleteState, setIsPatientProfileCompleteState] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = localStorage.getItem('mindhaven-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

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

    const handleProfileUpdate = () => {
      checkUserRole();
    };

    window.addEventListener('patient-profile-updated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('patient-profile-updated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('mindhaven-theme', theme);
  }, [theme]);

  const checkUserRole = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const role = await getUserRole();
        setUserRole(role);

        if (role === 'patient') {
          const profileComplete = await isPatientProfileComplete();
          setIsPatientProfileCompleteState(profileComplete);
        } else {
          setIsPatientProfileCompleteState(true);
        }
      } else {
        setUserRole(null);
        setIsPatientProfileCompleteState(true);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole(null);
      setIsPatientProfileCompleteState(true);
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
  const isDark = theme === 'dark';

  const patientNavLinks = isPatientProfileCompleteState
    ? [
        { to: '/', label: 'Home', icon: LayoutDashboard },
        { to: '/about', label: 'About', icon: Brain },
        { to: '/faqs', label: 'FAQs', icon: MessageSquareText },
        { to: '/chat', label: 'Chat', icon: MessageSquareText },
        { to: '/profile', label: 'Profile', icon: UserRound },
      ]
    : [{ to: '/profile', label: 'Complete Profile', icon: UserRound }];

  const navLinks =
    userRole === 'admin'
      ? [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }]
      : userRole === 'doctor'
        ? [{ to: '/doctor', label: 'Dashboard', icon: LayoutDashboard }]
        : userRole === 'patient'
          ? patientNavLinks
          : [
              { to: '/', label: 'Home', icon: LayoutDashboard },
              { to: '/about', label: 'About', icon: Brain },
              { to: '/faqs', label: 'FAQs', icon: MessageSquareText },
            ];

  const brandTarget = userRole === 'patient' && !isPatientProfileCompleteState ? '/profile' : '/';

  return (
    <nav className={`sticky top-0 z-50 border-b backdrop-blur ${
      isDark ? 'border-slate-800/90 bg-slate-950/90' : 'border-slate-200/90 bg-white/90'
    }`}>
      <div className="content-shell">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link to={brandTarget} className="flex items-center gap-3 fade-in-up">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-700 text-white shadow-sm">
                <Brain className="h-5 w-5" />
              </span>
              <span className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>MindHaven</span>
            </Link>
            <div className="ml-8 hidden items-center gap-2 lg:flex">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                    isActive(to)
                      ? 'bg-cyan-100 text-cyan-900'
                      : isDark
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className={`mr-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {!isLoading && !hideButton && (
              userRole ? (
                <button
                  onClick={handleClick}
                  disabled={loading}
                  className={`btn-primary ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {loading ? 'Signing Out...' : 'Sign Out'}
                </button>
              ) : (
                !hideSignInButton && (
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-primary"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </button>
                )
              )
            )}
            <div className="ml-3 lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`inline-flex items-center justify-center rounded-xl border p-2 ${
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-100'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="content-shell pb-4">
          <div className="surface-card p-3">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-cyan-100 text-cyan-900'
                    : isDark
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;