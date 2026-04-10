import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUserRole, isPatientProfileComplete } from '../lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'doctor' | 'patient';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const role = await getUserRole();

      if (role !== requiredRole) {
        setIsAuthorized(false);
        return;
      }

      if (requiredRole === 'patient') {
        const profileComplete = await isPatientProfileComplete();
        const isProfileRoute = location.pathname === '/profile';

        if (!profileComplete && !isProfileRoute) {
          setNeedsProfileCompletion(true);
          setIsAuthorized(true);
          return;
        }
      }

      setNeedsProfileCompletion(false);
      setIsAuthorized(true);
    };

    checkAuth();
  }, [requiredRole, location.pathname]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  if (needsProfileCompletion) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
};