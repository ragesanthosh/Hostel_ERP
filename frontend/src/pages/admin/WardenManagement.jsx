import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/endpoints';
import { adminNavItems, emptyWardenForm } from '../../config/adminNav';

export default function WardenManagement() {
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyWardenForm);
  const [editId, setEditId] = useState(null);

  const fetchWardens = () => {
    setLoading(true);
    adminAPI
      .getWardens({ search })
      .then(({ data }) => setWardens(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWardens();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editId && !payload.password) delete payload.password;

      if (editId) {
        await adminAPI.updateWarden(editId, payload);
        toast.success('Warden updated');
      } else {
        await adminAPI.createWarden(payload);
        toast.success('Warden created');
      }
      setModal(null);
      setForm(emptyWardenForm);
      setEditId(null);
      fetchWardens();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (warden) => {
    setEditId(warden._id);
    setForm({
      name: warden.name,
      employeeId: warden.employeeId,
      email: warden.email,
      mobile: warden.mobile || '',
      pin: '',
      password: '',
    });
    setModal('form');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this warden?')) return;
    try {
      await adminAPI.deleteWarden(id);
      toast.success('Warden deleted');
      fetchWardens();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Layout navItems={adminNavItems} pageTitle="Admin Portal">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="page-title">Warden Management</h2>
          <p className="page-subtitle">Create wardens before assigning them to hostels</p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyWardenForm); setModal('form'); }}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" /> Add Warden
        </button>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          placeholder="Search name, email, employee ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-search"
        />
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="panel">
          <table className="w-full text-sm">
            <thead className="panel-head">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Employee ID</th>
                <th className="table-th">Email</th>
                <th className="table-th">Mobile</th>
                <th className="table-th">Assigned Hostel</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {wardens.map((w) => (
                <tr key={w._id} className="panel-row">
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3">{w.employeeId}</td>
                  <td className="px-4 py-3">{w.email}</td>
                  <td className="px-4 py-3">{w.mobile || '-'}</td>
                  <td className="px-4 py-3">
                    {w.hostelId?.name ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">{w.hostelId.name}</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(w)} className="mr-2 text-blue-600 dark:text-blue-400"><Pencil className="h-4 w-4 inline" /></button>
                    <button onClick={() => handleDelete(w._id)} className="text-red-600 dark:text-red-400"><Trash2 className="h-4 w-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Warden' : 'Add Warden'} size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {[
            ['name', 'Full Name'],
            ['employeeId', 'Employee / Warden ID'],
            ['email', 'College Email'],
            ['mobile', 'Mobile Number'],
            ['pin', 'Security PIN'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <input
                type={key === 'email' ? 'email' : 'text'}
                required={!editId || key !== 'pin'}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="form-control"
                placeholder={editId && key === 'pin' ? 'Leave blank to keep' : ''}
              />
            </div>
          ))}
          <div>
            <label className="form-label">Password {editId && '(leave blank to keep)'}</label>
            <input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="form-control" required={!editId} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="w-full rounded-lg bg-primary-600 py-2.5 text-white">{editId ? 'Update' : 'Create Warden'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
