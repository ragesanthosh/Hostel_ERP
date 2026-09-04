import { useState, useEffect, useMemo } from 'react';
import { Home, Users, DoorOpen, FileText, Search } from 'lucide-react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { wardenAPI } from '../../services/endpoints';

const navItems = [
  { path: '/warden', label: 'Dashboard', icon: Home },
  { path: '/warden/students', label: 'Student List', icon: Users },
  { path: '/warden/rooms', label: 'Room Status', icon: DoorOpen },
  { path: '/warden/documents', label: 'Documents', icon: FileText },
];

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    wardenAPI.getStudents().then(({ data }) => {
      setStudents(data.data);
      setLoading(false);
    });
  }, []);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return students;

    return students.filter((s) => {
      const haystack = [
        s.name,
        s.regNo,
        s.rollNo,
        s.branch,
        s.year,
        s.email,
        s.roomId?.roomNumber,
        s.isRoomAllocated ? 'allocated' : 'pending',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [students, search]);

  if (loading) return <Layout navItems={navItems} pageTitle="Warden Portal"><LoadingSpinner className="py-20" /></Layout>;

  return (
    <Layout navItems={navItems} pageTitle="Warden Portal">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Management</h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-slate-700 dark:text-slate-300">
          {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          placeholder="Search name, reg no, roll no, branch, year, room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-search"
        />
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          No students assigned to your hostel yet.
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          No students match your search.
        </div>
      ) : (
        <div className="panel">
          <table className="w-full text-sm">
            <thead className="panel-head">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400">Reg No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400">Roll No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400">Branch</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400">Year</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400">Room</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredStudents.map((s) => (
                <tr key={s._id} className="panel-row">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
                  <td className="px-4 py-3 dark:text-slate-300">{s.regNo}</td>
                  <td className="px-4 py-3 dark:text-slate-300">{s.rollNo}</td>
                  <td className="px-4 py-3 dark:text-slate-300">{s.branch}</td>
                  <td className="px-4 py-3 dark:text-slate-300">{s.year}</td>
                  <td className="px-4 py-3 dark:text-slate-300">{s.roomId?.roomNumber || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      s.isRoomAllocated
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                    }`}>
                      {s.isRoomAllocated ? 'Allocated' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
