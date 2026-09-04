import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, DoorOpen, FileText, ArrowRight } from 'lucide-react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardHeader } from '../../components/ui/Card';
import OccupancyBar from '../../components/ui/OccupancyBar';
import Button from '../../components/ui/Button';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import { wardenAPI } from '../../services/endpoints';

const navItems = [
  { path: '/warden', label: 'Dashboard', icon: Home },
  { path: '/warden/students', label: 'Student List', icon: Users },
  { path: '/warden/rooms', label: 'Room Status', icon: DoorOpen },
  { path: '/warden/documents', label: 'Documents', icon: FileText },
];

export default function WardenDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wardenAPI.getDashboard().then(({ data: res }) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  const occupancyPercent = data
    ? Math.round((data.occupiedSeats / data.capacity) * 100) || 0
    : 0;

  return (
    <Layout navItems={navItems} pageTitle="Warden Portal" breadcrumbs={[{ label: 'Dashboard' }]}>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <PageHeader
            title={data.hostel.name}
            description="Monitor occupancy, students, and document verification"
            action={
              <>
                <Link to="/warden/students"><Button variant="secondary" size="sm" icon={Users}>Students</Button></Link>
                <Link to="/warden/documents"><Button size="sm" icon={FileText}>Documents</Button></Link>
              </>
            }
          />

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Capacity" value={data.capacity} color="blue" />
            <StatCard title="Occupied" value={data.occupiedSeats} color="orange" subtitle={`${occupancyPercent}% filled`} />
            <StatCard title="Vacant Seats" value={data.vacantSeats} color="green" />
            <StatCard title="Total Rooms" value={data.totalRooms} color="purple" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Occupancy Overview" />
              <OccupancyBar label="Current Occupancy" occupied={data.occupiedSeats} total={data.capacity} />
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="stat-mini-emerald">
                  <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">{data.vacantSeats}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Vacant seats</p>
                </div>
                <div className="stat-mini-amber">
                  <p className="text-2xl font-semibold text-amber-700 dark:text-amber-300">{data.totalRooms}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Total rooms</p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Quick Actions" />
              <div className="space-y-3">
                {[
                  { label: 'View all students', path: '/warden/students', icon: Users },
                  { label: 'Check room status', path: '/warden/rooms', icon: DoorOpen },
                  { label: 'Verify documents', path: '/warden/documents', icon: FileText },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="nav-list-item"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <item.icon className="h-4 w-4 text-primary-600" />
                      {item.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}
