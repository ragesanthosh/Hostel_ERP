import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, UserPlus, AlertTriangle, Upload, Download, DoorOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import ImportReport from '../../components/ImportReport';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/endpoints';
import { adminNavItems, emptyHostelForm, HOSTEL_GENDERS, HOSTEL_STATUSES } from '../../config/adminNav';

export default function HostelManagement() {
  const [hostels, setHostels] = useState([]);
  const [availableWardens, setAvailableWardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [form, setForm] = useState(emptyHostelForm);
  const [selectedWardenId, setSelectedWardenId] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importReport, setImportReport] = useState(null);

  const fetchHostels = () => {
    adminAPI
      .getDashboard()
      .then(({ data }) => setHostels(data.data.hostels))
      .catch((err) => toast.error(err.message || 'Failed to load hostels'))
      .finally(() => setLoading(false));
  };

  const fetchAvailableWardens = () => {
    adminAPI
      .getAvailableWardens()
      .then(({ data }) => setAvailableWardens(data.data))
      .catch((err) => toast.error(err.message || 'Failed to load wardens'));
  };

  useEffect(() => {
    fetchHostels();
    fetchAvailableWardens();
  }, []);

  const downloadTemplate = async (type) => {
    const fn = type === 'hostel' ? adminAPI.downloadHostelTemplate : adminAPI.downloadRoomTemplate;
    const name = type === 'hostel' ? 'hostel_import_template.xlsx' : 'room_import_template.xlsx';
    const { data } = await fn();
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        floors: form.floors ? Number(form.floors) : undefined,
      };
      if (modal === 'edit') {
        await adminAPI.updateHostel(selectedHostel._id, payload);
        toast.success('Hostel updated');
      } else {
        await adminAPI.createHostel(payload);
        toast.success('Hostel created');
      }
      setModal(null);
      setForm(emptyHostelForm);
      fetchHostels();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImportHostels = async (e) => {
    e.preventDefault();
    if (!importFile) return toast.error('Select a file');
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const { data } = await adminAPI.importHostels(fd);
      setImportReport(data.data);
      toast.success(`Imported ${data.data.successCount} hostels`);
      fetchHostels();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImportRooms = async (e) => {
    e.preventDefault();
    if (!importFile) return toast.error('Select a file');
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const { data } = await adminAPI.importRoomsGlobal(fd);
      setImportReport(data.data);
      toast.success(`Imported ${data.data.successCount} rooms`);
      fetchHostels();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this hostel and all its rooms?')) return;
    try {
      await adminAPI.deleteHostel(id);
      toast.success('Hostel deleted');
      fetchHostels();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openWardenModal = (hostel) => {
    setSelectedHostel(hostel);
    setSelectedWardenId('');
    fetchAvailableWardens();
    setModal('warden');
  };

  const handleAssignWarden = async (e) => {
    e.preventDefault();
    if (!selectedWardenId) return toast.error('Select a warden');
    try {
      await adminAPI.assignWardenToHostel(selectedHostel._id, selectedWardenId);
      toast.success('Warden assigned');
      setModal(null);
      fetchHostels();
      fetchAvailableWardens();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const wardensForSelect = (hostel) => {
    const list = [...availableWardens];
    if (hostel.wardenId && !list.find((w) => w._id === hostel.wardenId._id)) {
      list.unshift(hostel.wardenId);
    }
    return list;
  };

  if (loading) return <Layout navItems={adminNavItems} pageTitle="Admin Portal"><LoadingSpinner className="py-20" /></Layout>;

  return (
    <Layout navItems={adminNavItems} pageTitle="Admin Portal">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="page-title">Hostel Management</h2>
          <p className="page-subtitle">Import hostels & rooms via Excel/CSV or add manually</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadTemplate('hostel')} className="btn-outline">
            <Download className="h-4 w-4" /> Hostel Template
          </button>
          <button onClick={() => downloadTemplate('room')} className="btn-outline">
            <Download className="h-4 w-4" /> Room Template
          </button>
          <button onClick={() => { setImportFile(null); setImportReport(null); setModal('importHostels'); }} className="btn-outline">
            <Upload className="h-4 w-4" /> Import Hostels
          </button>
          <button onClick={() => { setImportFile(null); setImportReport(null); setModal('importRooms'); }} className="btn-outline">
            <Upload className="h-4 w-4" /> Import Rooms
          </button>
          <button onClick={() => { setForm(emptyHostelForm); setModal('create'); }} className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">
            <Plus className="h-4 w-4" /> Add Hostel
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hostels.map((hostel) => (
          <div key={hostel._id} className={`content-card p-6 ${!hostel.wardenId ? 'hostel-card-warn' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{hostel.name}</h3>
                <p className="text-xs font-medium text-primary-600 dark:text-primary-400">{hostel.code}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Capacity: {hostel.capacity}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{hostel.gender} · {hostel.status || 'Active'}</p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  Warden:{' '}
                  <span className={hostel.wardenId ? 'font-medium text-green-700 dark:text-green-400' : 'font-medium text-red-600 dark:text-red-400'}>
                    {hostel.wardenId?.name || 'Not assigned'}
                  </span>
                </p>
              </div>
              {!hostel.wardenId && <AlertTriangle className="h-5 w-5 text-orange-500" />}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/admin/hostels/${hostel._id}/rooms`} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white">
                <DoorOpen className="h-3 w-3" /> Manage Rooms
              </Link>
              <button onClick={() => openWardenModal(hostel)} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white">
                <UserPlus className="h-3 w-3" /> {hostel.wardenId ? 'Change' : 'Assign'} Warden
              </button>
              <button
                onClick={() => {
                  setSelectedHostel(hostel);
                  setForm({
                    name: hostel.name,
                    code: hostel.code,
                    capacity: hostel.capacity,
                    floors: hostel.floors || '',
                    gender: hostel.gender || 'Mixed',
                    status: hostel.status || 'Active',
                  });
                  setModal('edit');
                }}
                className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
              >
                <Pencil className="h-3 w-3 inline" /> Edit
              </button>
              <button onClick={() => handleDelete(hostel._id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
                <Trash2 className="h-3 w-3 inline" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit Hostel' : 'Add Hostel'} size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <input placeholder="Hostel Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="form-control sm:col-span-2" />
          <input placeholder="Hostel Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required className="form-control" />
          <input type="number" placeholder="Total Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required min="0" className="form-control" />
          <input type="number" placeholder="Floors (optional)" value={form.floors} onChange={(e) => setForm({ ...form, floors: e.target.value })} min="1" className="form-control" />
          <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="form-control">
            {HOSTEL_GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-control">
            {HOSTEL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="rounded-lg bg-primary-600 py-2.5 text-white sm:col-span-2">{modal === 'edit' ? 'Update' : 'Create'}</button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'importHostels'} onClose={() => setModal(null)} title="Import Hostels">
        {importReport ? (
          <ImportReport report={importReport} onClose={() => { setImportReport(null); setModal(null); }} />
        ) : (
          <form onSubmit={handleImportHostels} className="space-y-4">
            <p className="page-subtitle">Upload Excel/CSV with: Hostel Name, Code, Capacity, Floors, Gender, Status</p>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setImportFile(e.target.files[0])} required className="w-full text-sm text-slate-700 dark:text-slate-300" />
            <button type="submit" className="w-full rounded-lg bg-primary-600 py-2.5 text-white">Upload & Import</button>
          </form>
        )}
      </Modal>

      <Modal isOpen={modal === 'importRooms'} onClose={() => setModal(null)} title="Import Rooms (All Hostels)" size="lg">
        {importReport ? (
          <ImportReport report={importReport} onClose={() => { setImportReport(null); setModal(null); }} />
        ) : (
          <form onSubmit={handleImportRooms} className="space-y-4">
            <p className="page-subtitle">Upload Excel/CSV with: Room Number, Hostel Code/Name, Floor, Capacity, Status. Hostels must exist first.</p>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setImportFile(e.target.files[0])} required className="w-full text-sm text-slate-700 dark:text-slate-300" />
            <button type="submit" className="w-full rounded-lg bg-primary-600 py-2.5 text-white">Upload & Import</button>
          </form>
        )}
      </Modal>

      <Modal isOpen={modal === 'warden'} onClose={() => setModal(null)} title={`Assign Warden — ${selectedHostel?.name}`}>
        <form onSubmit={handleAssignWarden} className="space-y-4">
          <p className="page-subtitle">
            <Link to="/admin/wardens" className="text-primary-600 hover:underline dark:text-primary-400">Create warden</Link> if none available
          </p>
          <select value={selectedWardenId} onChange={(e) => setSelectedWardenId(e.target.value)} required className="form-control">
            <option value="">Select warden...</option>
            {selectedHostel && wardensForSelect(selectedHostel).map((w) => (
              <option key={w._id} value={w._id}>{w.name} ({w.employeeId})</option>
            ))}
          </select>
          <button type="submit" className="w-full rounded-lg bg-green-600 py-2 text-white">Assign Warden</button>
        </form>
      </Modal>
    </Layout>
  );
}
