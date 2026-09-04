import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const CHANGE_PASSWORD_ROUTES = {
  student: '/student/change-password',
  warden: '/warden/change-password',
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectMap = { admin: '/admin', student: '/student', warden: '/warden' };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }

  if (user.isFirstLogin && ['student', 'warden'].includes(user.role)) {
    const changePasswordPath = CHANGE_PASSWORD_ROUTES[user.role];
    if (location.pathname !== changePasswordPath) {
      return <Navigate to={changePasswordPath} replace />;
    }
  }

  return children;
}
