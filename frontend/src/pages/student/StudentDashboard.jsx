import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, DoorOpen, FileUp, CheckCircle, Building, Bell, ArrowRight } from 'lucide-react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StepProgress from '../../components/ui/StepProgress';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import { studentAPI } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/student', label: 'Dashboard', icon: Home },
  { path: '/student/group', label: 'Group & Room', icon: Users },
  { path: '/student/documents', label: 'Documents', icon: FileUp },
  { path: '/student/confirmation', label: 'Confirmation', icon: CheckCircle },
];

const WORKFLOW_STEPS = [
  { id: 'hostel', label: 'Hostel' },
  { id: 'group', label: 'Group' },
  { id: 'invite', label: 'Invites' },
  { id: 'room', label: 'Room' },
  { id: 'docs', label: 'Documents' },
  { id: 'done', label: 'Confirm' },
];

function getWorkflowStep(student) {
  const group = student.groupId;
  // Allocation complete — documents submitted and room assigned
  if (student.isRoomAllocated || group?.documentsSubmitted) return 5;
  // Room selected, documents still pending
  if (group?.status === 'allocated') return 4;
  if (group?.status === 'active') return 3;
  if (group?.status === 'pending_invites' || group?.status === 'forming') return 2;
  if (student.hostelId) return 1;
  return 0;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getDashboard().then(({ data: res }) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  const student = data?.student;
  const pendingInvitations = data?.pendingInvitations || [];
  const currentStep = student ? getWorkflowStep(student) : 0;

  return (
    <Layout navItems={navItems} pageTitle="Student Portal" breadcrumbs={[{ label: 'Dashboard' }]}>
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'Student'}`}
        description="Track your hostel allocation progress"
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <Card className="mb-8">
            <StepProgress steps={WORKFLOW_STEPS} currentStep={currentStep} />
          </Card>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Assigned Hostel"
              value={student.hostelId?.name || 'Pending'}
              icon={Building}
              color="primary"
            />
            <StatCard
              title="Branch / Year"
              value={`${student.branch}`}
              subtitle={student.year}
              icon={Users}
              color="green"
            />
            <StatCard
              title="Room Status"
              value={student.isRoomAllocated ? `Room ${student.roomId?.roomNumber}` : 'Not allocated'}
              icon={DoorOpen}
              color="orange"
            />
          </div>

          {pendingInvitations.length > 0 && (
            <Card className="mb-8 card-amber">
              <div className="mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-amber-900 dark:text-amber-200">Pending Invitations</h3>
                <Badge variant="warning">{pendingInvitations.length}</Badge>
              </div>
              <div className="space-y-3">
                {pendingInvitations.map((inv) => (
                  <div key={inv._id} className="inner-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">From {inv.fromUser?.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Group leader: {inv.groupId?.leaderId?.name}</p>
                    </div>
                    <Link to="/student/group">
                      <Button size="sm">Respond</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {!student.groupId && !student.isRoomAllocated && (
            <Card className="text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Start Room Allocation</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Create your group, invite roommates, select a room, and upload documents to complete allocation.
              </p>
              <Link to="/student/group" className="mt-6 inline-block">
                <Button icon={ArrowRight}>Get Started</Button>
              </Link>
            </Card>
          )}

          {(student.isRoomAllocated || student.groupId?.documentsSubmitted) && (
            <Card className="card-emerald text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="mt-4 text-lg font-semibold text-emerald-900 dark:text-emerald-200">Allocation Complete</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {student.isRoomAllocated
                  ? `Room ${student.roomId?.roomNumber || '—'} assigned in ${student.hostelId?.name || 'your hostel'}.`
                  : 'Documents submitted — awaiting final processing.'}
              </p>
              {student.documentsVerified ? (
                <Badge variant="success" className="mt-3">Documents verified</Badge>
              ) : (
                <Badge variant="warning" className="mt-3">Pending warden verification</Badge>
              )}
              <Link to="/student/confirmation" className="mt-6 inline-block">
                <Button variant="secondary" size="sm">View Confirmation</Button>
              </Link>
            </Card>
          )}
        </>
      )}
    </Layout>
  );
}
