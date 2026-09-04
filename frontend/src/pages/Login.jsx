import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, GraduationCap, UserCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ThemeToggle';

const ROLES = [
  { id: 'student', label: 'Student', icon: GraduationCap, desc: 'Room allocation portal' },
  { id: 'admin', label: 'Admin', icon: Shield, desc: 'Manage hostels & students' },
  { id: 'warden', label: 'Warden', icon: UserCheck, desc: 'Verify & monitor hostel' },
];

export default function Login() {
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    pin: '',
    password: '',
    regNo: '',
    rollNo: '',
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (role === 'admin') {
        response = await authAPI.loginAdmin({
          name: form.name,
          email: form.email,
          pin: form.pin,
          password: form.password,
        });
      } else if (role === 'student') {
        response = await authAPI.loginStudent({
          regNo: form.regNo,
          rollNo: form.rollNo,
          email: form.email,
          password: form.password,
        });
      } else {
        response = await authAPI.loginWarden({
          email: form.email,
          password: form.password,
        });
      }

      login(response.data.user, response.data.token);
      toast.success('Welcome back!');

      const loggedInUser = response.data.user;
      if (loggedInUser?.isFirstLogin && (role === 'student' || role === 'warden')) {
        navigate(`/${role}/change-password`);
      } else if (role === 'admin') {
        navigate('/admin/students');
      } else {
        navigate(`/${role}`);
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-[45%] overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src="/images/hostel-login.jpg"
          alt="College hostel building"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/75 to-primary-950/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-600/25 via-transparent to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">Hostel ERP</span>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-semibold leading-tight text-white">
            Smart hostel room allocation for your campus
          </h1>
          <p className="mt-4 max-w-md text-slate-200/90">
            Manage students, wardens, hostels, and room assignments — all in one professional platform.
          </p>
        </div>
        <p className="relative z-10 text-sm text-slate-300/80">© College Hostel Management System</p>
      </div>

      {/* Login form */}
      <div className="relative flex flex-1 items-center justify-center bg-white p-6 dark:bg-slate-950 sm:p-10">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md animate-slide-up">
          <div className="relative mb-8 overflow-hidden rounded-2xl lg:hidden">
            <img
              src="/images/hostel-login.jpg"
              alt="College hostel building"
              className="h-40 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Hostel ERP</span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose your role and enter credentials</p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`rounded-xl border-2 p-3 text-center transition-all ${
                  role === r.id
                    ? 'border-primary-600 bg-primary-50 shadow-sm dark:border-slate-600 dark:bg-slate-800/90 dark:shadow-none'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <r.icon className={`mx-auto h-5 w-5 ${role === r.id ? 'text-primary-600 dark:text-slate-400' : 'text-slate-400'}`} />
                <p className={`mt-2 text-xs font-medium ${role === r.id ? 'text-primary-700 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
                  {r.label}
                </p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {role === 'admin' && (
              <>
                <Input label="Admin Name" name="name" value={form.name} onChange={handleChange} required placeholder="System Admin" />
                <Input label="Security PIN" name="pin" value={form.pin} onChange={handleChange} required placeholder="••••" />
              </>
            )}

            {role === 'student' && (
              <>
                <Input label="Registration No." name="regNo" value={form.regNo} onChange={handleChange} required />
                <Input label="Roll No." name="rollNo" value={form.rollNo} onChange={handleChange} required />
              </>
            )}

            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@college.edu" />
            <Input label="Password" name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />

            <Button type="submit" loading={loading} className="w-full" icon={ArrowRight}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
