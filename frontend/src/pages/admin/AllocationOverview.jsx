import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/endpoints';
import { adminNavItems } from '../../config/adminNav';

export default function AllocationOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAllocationOverview().then(({ data: res }) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Layout navItems={adminNavItems} pageTitle="Admin Portal"><LoadingSpinner className="py-20" /></Layout>;

  return (
    <Layout navItems={adminNavItems} pageTitle="Admin Portal">
      <h2 className="page-title mb-6">Allocation Overview</h2>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="content-card p-6">
          <p className="page-subtitle">Total Rooms</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.totalRooms}</p>
        </div>
        <div className="content-card p-6">
          <p className="page-subtitle">Allocated Students</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.allocatedStudents}</p>
        </div>
        <div className="content-card p-6">
          <p className="page-subtitle">Total Mappings</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.mappings.length}</p>
        </div>
      </div>

      <div className="content-card">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-600">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Branch-Year to Hostel Mappings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="panel-head">
              <tr>
                <th className="table-th-lg">Year</th>
                <th className="table-th-lg">Branch</th>
                <th className="table-th-lg">Hostel</th>
                <th className="table-th-lg">Strength</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
              {data.mappings.map((m) => (
                <tr key={m._id} className="panel-row">
                  <td className="table-td-lg">{m.year}</td>
                  <td className="table-td-lg">{m.branch}</td>
                  <td className="table-td-lg">{m.hostelId?.name}</td>
                  <td className="table-td-lg">{m.studentStrength}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
