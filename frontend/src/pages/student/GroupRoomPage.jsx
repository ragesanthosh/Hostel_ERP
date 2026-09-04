import { useState, useEffect } from 'react';
import { Home, Users, FileUp, CheckCircle, DoorOpen, UserPlus, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import StepProgress from '../../components/ui/StepProgress';
import EmptyState from '../../components/ui/EmptyState';
import { studentAPI } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/student', label: 'Dashboard', icon: Home },
  { path: '/student/group', label: 'Group & Room', icon: Users },
  { path: '/student/documents', label: 'Documents', icon: FileUp },
  { path: '/student/confirmation', label: 'Confirmation', icon: CheckCircle },
];

const FLOW_STEPS = [
  { id: 'size', label: 'Group Size' },
  { id: 'invite', label: 'Invites' },
  { id: 'room', label: 'Room' },
  { id: 'done', label: 'Done' },
];

const stepToIndex = { size: 0, invite: 1, waiting: 1, room: 2, allocated: 3, done: 3, invalid: 0 };

export default function GroupRoomPage() {
  const { user, refreshUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [group, setGroup] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [step, setStep] = useState('size');
  const [groupSize, setGroupSize] = useState(1);
  const [roommates, setRoommates] = useState([{ regNo: '', rollNo: '', email: '' }]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [dashRes, groupRes] = await Promise.all([
        studentAPI.getDashboard(),
        studentAPI.getGroup(),
      ]);
      setDashboard(dashRes.data.data);

      const g = groupRes.data.data;
      setGroup(g);

      if (g) {
        if (g.status === 'invalid') {
          setStep('invalid');
        } else if (g.documentsSubmitted || dashRes.data.data?.student?.isRoomAllocated) {
          setStep('done');
        } else if (g.status === 'allocated') {
          setStep('allocated');
        } else if (g.status === 'active') {
          setStep('room');
          const roomsRes = await studentAPI.getAvailableRooms();
          setRooms(roomsRes.data.data);
        } else if (g.status === 'pending_invites') {
          setStep('waiting');
        } else if (g.status === 'forming') {
          setGroupSize(g.size);
          setRoommates(
            Array.from({ length: g.size - 1 }, () => ({ regNo: '', rollNo: '', email: '' }))
          );
          setStep('invite');
        }
      } else {
        setStep('size');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGroup = async () => {
    setSubmitting(true);
    try {
      await studentAPI.createGroup({ size: groupSize });
      toast.success('Group created!');
      if (groupSize === 1) {
        const roomsRes = await studentAPI.getAvailableRooms();
        setRooms(roomsRes.data.data);
        setStep('room');
      } else {
        setRoommates(
          Array.from({ length: groupSize - 1 }, () => ({ regNo: '', rollNo: '', email: '' }))
        );
        setStep('invite');
      }
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async () => {
    setSubmitting(true);
    try {
      await studentAPI.inviteRoommates({ roommates });
      toast.success('Invitations sent!');
      setStep('waiting');
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (invitationId, action) => {
    try {
      const { data } = await studentAPI.respondInvitation(invitationId, { action });
      toast.success(data.message);
      if (data.groupInvalid) {
        await refreshUser();
      }
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSelectRoom = async (roomId) => {
    setSubmitting(true);
    try {
      await studentAPI.selectRoom({ roomId });
      toast.success('Room selected! Upload documents next.');
      await refreshUser();
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    try {
      await studentAPI.resetGroup();
      toast.success('Group reset. Please create a new group.');
      setStep('size');
      setGroup(null);
      await refreshUser();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBackToSize = async () => {
    try {
      const savedSize = group?.size || groupSize;
      await studentAPI.resetGroup();
      setGroup(null);
      setGroupSize(savedSize);
      setStep('size');
      await refreshUser();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updateRoommate = (index, field, value) => {
    const updated = [...roommates];
    updated[index] = { ...updated[index], [field]: value };
    setRoommates(updated);
  };

  if (loading) return <Layout navItems={navItems} pageTitle="Student Portal"><LoadingSpinner className="py-20" /></Layout>;

  const pendingInvitations = dashboard?.pendingInvitations || [];
  const isLeader = group?.leaderId?._id === user?._id || group?.leaderId === user?._id;
  const neededSeats = group?.size || groupSize;

  const getRoomStatus = (room) => {
    if (room.status === 'Under Maintenance' || room.status === 'Inactive') return 'maintenance';
    if ((room.vacantSeats || 0) < neededSeats) return 'full';
    return 'available';
  };

  return (
    <Layout navItems={navItems} pageTitle="Group & Room">
      <PageHeader
        title="Group & Room Selection"
        description="Create your group, invite roommates, and pick your room"
        breadcrumbs={[{ label: 'Student', path: '/student' }, { label: 'Group & Room' }]}
      />

      <Card className="mb-8">
        <StepProgress steps={FLOW_STEPS} currentStep={stepToIndex[step] ?? 0} />
      </Card>

      {pendingInvitations.length > 0 && (
        <Card className="mb-6 card-amber">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
            <UserPlus className="h-5 w-5" /> Your Invitations
          </h3>
          {pendingInvitations.map((inv) => (
            <div key={inv._id} className="inner-card mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-700 dark:text-slate-300">Invitation from <strong className="text-slate-900 dark:text-slate-100">{inv.fromUser?.name}</strong></p>
              <div className="flex gap-2">
                <Button variant="success" size="sm" onClick={() => handleRespond(inv._id, 'accept')}>Accept</Button>
                <Button variant="danger" size="sm" onClick={() => handleRespond(inv._id, 'reject')}>Reject</Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {step === 'invalid' && (
        <Card className="card-rose text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h3 className="mt-4 text-lg font-semibold text-rose-900 dark:text-rose-200">Group Invalid</h3>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">A roommate rejected the invitation. Create a new group to continue.</p>
          <Button className="mt-6" onClick={handleReset}>Create New Group</Button>
        </Card>
      )}

      {step === 'size' && !group && (
        <Card>
          <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Select Group Size</h3>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Choose how many members will share the room (including you)</p>
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[1, 2, 3].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setGroupSize(size)}
                className={`rounded-2xl border-2 p-6 text-center transition-all ${
                  groupSize === size
                    ? 'border-primary-600 bg-primary-50 shadow-md shadow-primary-600/10 dark:bg-primary-950/40'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-700/50'
                }`}
              >
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{size}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{size === 1 ? 'Solo' : `${size} members`}</p>
              </button>
            ))}
          </div>
          <Button onClick={handleCreateGroup} loading={submitting} className="w-full">Create Group</Button>
        </Card>
      )}

      {step === 'invite' && isLeader && (
        <Card>
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBackToSize}>← Back to size</Button>
            <Badge variant="primary">{group?.size || groupSize} members</Badge>
          </div>
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Invite Roommates</h3>
          {roommates.map((rm, i) => (
            <div key={i} className="mb-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-600 dark:bg-slate-700/40">
              <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Roommate {i + 1}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input placeholder="Reg No" value={rm.regNo} onChange={(e) => updateRoommate(i, 'regNo', e.target.value)} />
                <Input placeholder="Roll No" value={rm.rollNo} onChange={(e) => updateRoommate(i, 'rollNo', e.target.value)} />
                <Input placeholder="Email" type="email" value={rm.email} onChange={(e) => updateRoommate(i, 'email', e.target.value)} />
              </div>
            </div>
          ))}
          <Button onClick={handleInvite} loading={submitting} className="w-full">Send Invitations</Button>
        </Card>
      )}

      {step === 'waiting' && (
        <Card className="card-amber text-center">
          <Clock className="mx-auto h-12 w-12 text-amber-500" />
          <h3 className="mt-4 font-semibold text-amber-900 dark:text-amber-200">Waiting for Roommates</h3>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">Invitations sent — waiting for all members to accept.</p>
          {group && (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              Group size: {group.size} · Members joined: {group.members?.length || 0}
            </p>
          )}
        </Card>
      )}

      {step === 'room' && isLeader && (
        <Card>
          <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Select a Room</h3>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Rooms with at least {neededSeats} vacant seat{neededSeats > 1 ? 's' : ''}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => {
              const status = getRoomStatus(room);
              const disabled = status !== 'available' || submitting;
              return (
                <button
                  key={room._id}
                  type="button"
                  onClick={() => !disabled && handleSelectRoom(room._id)}
                  disabled={disabled}
                  className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
                    status === 'available'
                      ? 'border-slate-200 hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 active:scale-[0.98] dark:border-slate-600 dark:bg-slate-800/50'
                      : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/50">
                      <DoorOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <Badge variant={status === 'available' ? 'success' : status === 'full' ? 'danger' : 'warning'}>
                      {status === 'available' ? 'Available' : status === 'full' ? 'Full' : 'Maintenance'}
                    </Badge>
                  </div>
                  <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Room {room.roomNumber}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Floor {room.floorNumber || '—'} · Capacity {room.capacity}</p>
                  <p className={`mt-2 text-sm font-medium ${status === 'available' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {room.vacantSeats} vacant seat{room.vacantSeats !== 1 ? 's' : ''}
                  </p>
                </button>
              );
            })}
          </div>
          {rooms.length === 0 && (
            <EmptyState icon={DoorOpen} title="No rooms available" description="No rooms match your group size right now." />
          )}
        </Card>
      )}

      {step === 'allocated' && (
        <Card className="card-emerald text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-4 font-semibold text-emerald-900 dark:text-emerald-200">Room Selected</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Room <strong className="text-slate-900 dark:text-slate-100">{group?.roomId?.roomNumber}</strong> is locked for your group.</p>
          <a href="/student/documents" className="mt-6 inline-block">
            <Button>Upload Documents</Button>
          </a>
        </Card>
      )}

      {step === 'done' && (
        <Card className="card-emerald text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-4 font-semibold text-emerald-900 dark:text-emerald-200">Allocation Complete</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Room <strong className="text-slate-900 dark:text-slate-100">{group?.roomId?.roomNumber || dashboard?.student?.roomId?.roomNumber}</strong> has been assigned to your group.
          </p>
          <a href="/student/confirmation" className="mt-6 inline-block">
            <Button>View Confirmation</Button>
          </a>
        </Card>
      )}
    </Layout>
  );
}
