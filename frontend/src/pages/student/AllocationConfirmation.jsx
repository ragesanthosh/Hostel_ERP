import { useState, useEffect } from 'react';
import { Home, Users, FileUp, CheckCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { studentAPI } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/student', label: 'Dashboard', icon: Home },
  { path: '/student/group', label: 'Group & Room', icon: Users },
  { path: '/student/documents', label: 'Documents', icon: FileUp },
  { path: '/student/confirmation', label: 'Confirmation', icon: CheckCircle },
];

export default function AllocationConfirmation() {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getGroup().then(({ data }) => {
      setGroup(data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Layout navItems={navItems} pageTitle="Student Portal"><LoadingSpinner className="py-20" /></Layout>;

  const isAllocated = user?.isRoomAllocated;

  return (
    <Layout navItems={navItems} pageTitle="Student Portal">
      <h2 className="page-title mb-6">Allocation Confirmation</h2>

      {isAllocated ? (
        <div className="content-card p-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h3 className="mt-4 text-2xl font-bold text-green-800 dark:text-green-300">Room Allocated Successfully!</h3>

          <div className="mx-auto mt-8 max-w-md space-y-4 text-left">
            {[
              ['Name', user.name],
              ['Hostel', user.hostelId?.name],
              ['Room Number', user.roomId?.roomNumber],
              ['Branch', user.branch],
              ['Year', user.year],
              ...(group ? [['Group Size', group.size]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-slate-200 pb-2 dark:border-slate-600">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Your room allocation is final. Please contact the warden for any queries.
          </p>
        </div>
      ) : (
        <div className="content-card bg-slate-50 p-8 text-center dark:bg-slate-800/50">
          <p className="text-slate-600 dark:text-slate-300">Room allocation is not yet complete.</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Complete group formation, room selection, and document upload.</p>
        </div>
      )}
    </Layout>
  );
}
