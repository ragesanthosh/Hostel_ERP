import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { authAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';

const studentNav = [
  { path: '/student', label: 'Dashboard', icon: Home },
];

const wardenNav = [
  { path: '/warden', label: 'Dashboard', icon: Home },
];

export default function ChangePassword({ role }) {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const isForced = user?.isFirstLogin;
  const navItems = role === 'student' ? studentNav : wardenNav;
  const homePath = `/${role}`;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (form.currentPassword === form.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      const token = localStorage.getItem('token');
      login(data.user, token);
      toast.success('Password changed successfully');
      navigate(homePath);
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout
      navItems={navItems}
      pageTitle={role === 'student' ? 'Student Portal' : 'Warden Portal'}
    >
      <div className="mx-auto max-w-lg">
        <Card>
          {isForced && (
            <div className="alert-warning mb-6 flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">First login — password change required</p>
                <p className="mt-1 text-sm opacity-90">
                  For security, you must set a new password before accessing the portal.
                </p>
              </div>
            </div>
          )}

          <h2 className="page-title mb-1">Change Password</h2>
          <p className="page-subtitle mb-6">
            {isForced
              ? 'Enter your temporary password and choose a new one.'
              : 'Update your account password.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange}
              required
              minLength={6}
              hint="At least 6 characters"
            />
            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
            />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="submit" loading={loading} className="flex-1">
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
              {isForced ? (
                <Button type="button" variant="secondary" onClick={handleLogout}>
                  Sign out
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={() => navigate(homePath)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
