import { useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { authAPI } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { adminNavItems } from '../../config/adminNav';

export default function AdminProfile() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const changingPassword = Boolean(form.newPassword || form.currentPassword);

    if (changingPassword) {
      if (!form.currentPassword) {
        toast.error('Current password is required to set a new password');
        return;
      }
      if (!form.newPassword) {
        toast.error('New password is required');
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      if (form.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }
    }

    if (form.name === user?.name && form.email === user?.email && !changingPassword) {
      toast.error('No changes to save');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
      };
      if (changingPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      const { data } = await authAPI.updateAdminProfile(payload);
      const token = localStorage.getItem('token');
      login(data.user, token);
      toast.success('Profile updated successfully');
      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout navItems={adminNavItems} pageTitle="Admin Portal">
      <div className="mx-auto max-w-lg">
        <Card>
          <h2 className="page-title mb-1">Admin Profile</h2>
          <p className="page-subtitle mb-6">Update your name, email, or password.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <div className="border-t border-slate-200 pt-4 dark:border-slate-600">
              <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Change Password (optional)
              </p>
              <div className="space-y-4">
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Required only if changing password"
                />
                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={handleChange}
                  minLength={6}
                />
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
