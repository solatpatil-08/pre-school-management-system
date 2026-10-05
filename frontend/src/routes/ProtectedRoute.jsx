import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If user's role is not authorized for this route, redirect to their role's home
    const defaultPaths = {
      admin: '/admin/dashboard',
      teacher: '/teacher/dashboard',
      parent: '/parent/dashboard',
    };
    return <Navigate to={defaultPaths[user?.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
