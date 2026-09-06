import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * Controls role-based access to protected portal routes.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="py-20 text-center text-text-secondary font-medium">
        Loading session...
      </div>
    );
  }

  // 1. If unauthenticated, redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If authenticated but wrong role, redirect to appropriate role portal
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'buyer') {
      return <Navigate to="/buyer" replace />;
    } else if (user.role === 'fpo') {
      return <Navigate to="/fpo" replace />;
    } else {
      return <Navigate to="/farmer" replace />;
    }
  }

  return children;
}
