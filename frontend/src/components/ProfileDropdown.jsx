import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, User, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge from './ui/Badge';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const profilePath =
    user?.role === 'admin'
      ? '/admin/profile'
      : user?.role === 'student'
        ? '/student/change-password'
        : '/warden/change-password';

  const profileLabel = user?.role === 'admin' ? 'Edit Profile' : 'Change Password';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-xs font-semibold text-white">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="max-w-[120px] truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 animate-slide-up rounded-xl border border-slate-200 bg-white py-2 shadow-lg shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-950/50">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            <Badge variant="primary" className="mt-2 capitalize">
              {user?.role}
            </Badge>
          </div>
          {(user?.role === 'admin' || !user?.isFirstLogin) && (
            <button
              onClick={() => {
                setOpen(false);
                navigate(profilePath);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {user?.role === 'admin' ? <User className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
              {profileLabel}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
