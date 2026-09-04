import { useState, useEffect } from 'react';
import { Home, Users, DoorOpen, FileText } from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { wardenAPI } from '../../services/endpoints';

const navItems = [
  { path: '/warden', label: 'Dashboard', icon: Home },
  { path: '/warden/students', label: 'Student List', icon: Users },
  { path: '/warden/rooms', label: 'Room Status', icon: DoorOpen },
  { path: '/warden/documents', label: 'Documents', icon: FileText },
];

export default function RoomStatus() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    wardenAPI.getRooms().then(({ data }) => {
      setRooms(data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Layout navItems={navItems} pageTitle="Warden Portal"><LoadingSpinner className="py-20" /></Layout>;

  return (
    <Layout navItems={navItems} pageTitle="Warden Portal">
      <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Room Monitoring</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rooms.map((room) => (
          <div
            key={room._id}
            onClick={() => setExpanded(expanded === room._id ? null : room._id)}
            className={`cursor-pointer rounded-xl border p-4 transition-colors ${
              room.occupiedSeats === room.capacity
                ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40'
                : room.isLocked
                ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/40'
                : 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Room {room.roomNumber}</p>
              {room.isLocked && (
                <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Locked</span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {room.occupiedSeats}/{room.capacity} occupied
            </p>
            <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-slate-700">
              <div
                className="h-2 rounded-full bg-primary-600"
                style={{ width: `${(room.occupiedSeats / room.capacity) * 100}%` }}
              />
            </div>

            {expanded === room._id && room.students?.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 dark:border-slate-600">
                {room.students.map((s) => (
                  <div key={s._id} className="text-xs">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                    <p className="text-gray-500 dark:text-slate-400">{s.regNo} | {s.branch}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
