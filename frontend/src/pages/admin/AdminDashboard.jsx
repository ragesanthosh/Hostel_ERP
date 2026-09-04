import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, BedDouble, UserCheck, GraduationCap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardHeader } from '../../components/ui/Card';
import OccupancyBar from '../../components/ui/OccupancyBar';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import { adminNavItems } from '../../config/adminNav';
import { adminAPI } from '../../services/endpoints';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI
      .getDashboard()
      .then(({ data }) => setStats(data.data))
      .catch((err) => toast.error(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const occupancyRate = stats
    ? Math.round((stats.totalOccupied / stats.totalCapacity) * 100) || 0
    : 0;

  return (
    <Layout
      navItems={adminNavItems}
      pageTitle="Admin Dashboard"
      breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Dashboard' }]}
    >
      <PageHeader
        title="Overview"
        description="Monitor hostel capacity, student allocation, and setup progress"
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : !stats ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-20">Unable to load dashboard data.</p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard title="Students" value={stats.totalStudents} icon={GraduationCap} color="blue" />
            <StatCard title="Wardens" value={stats.totalWardens} icon={UserCheck} color="purple" />
            <StatCard title="Hostels" value={stats.totalHostels} icon={Building} color="green" />
            <StatCard title="Capacity" value={stats.totalCapacity} icon={BedDouble} color="orange" />
            <StatCard title="Occupied" value={stats.totalOccupied} icon={Users} color="red" subtitle={`${occupancyRate}% utilization`} />
            <StatCard title="Wardens Assigned" value={stats.assignedWardens} icon={UserCheck} color="primary" />
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Hostel Occupancy" description="Real-time capacity across all hostels" />
              <div className="space-y-5">
                {stats.hostels.map((hostel) => (
                  <OccupancyBar
                    key={hostel._id}
                    label={hostel.name}
                    occupied={hostel.occupiedSeats}
                    total={hostel.capacity}
                  />
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Setup Checklist" description="Complete in order" />
              <ol className="space-y-3 text-sm">
                {[
                  { label: 'Student Management', path: '/admin/students' },
                  { label: 'Warden Management', path: '/admin/wardens' },
                  { label: 'Academic Structure', path: '/admin/academic' },
                  { label: 'Hostel Management', path: '/admin/hostels' },
                  { label: 'Branch-Year Mapping', path: '/admin/mappings' },
                ].map((item, i) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="nav-list-item"
                    >
                      <span className="text-slate-700 dark:text-slate-300">
                        <span className="mr-2 font-medium text-primary-600">{i + 1}.</span>
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          <Card padding={false}>
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-600">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Hostel Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-400">
                    <th className="px-6 py-3">Hostel</th>
                    <th className="px-6 py-3">Warden</th>
                    <th className="px-6 py-3">Occupied</th>
                    <th className="px-6 py-3">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-600">
                  {stats.hostels.map((hostel) => (
                    <tr key={hostel._id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/40">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{hostel.name}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{hostel.wardenId?.name || '—'}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{hostel.occupiedSeats} / {hostel.capacity}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">{hostel.capacity - hostel.occupiedSeats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </Layout>
  );
}
