import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Upload, Download, ArrowLeft, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import ImportReport from '../../components/ImportReport';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/endpoints';
import { adminNavItems, emptyRoomForm, ROOM_STATUSES } from '../../config/adminNav';

export default function RoomManagement() {
  const { hostelId } = useParams();
  const [hostel, setHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyRoomForm);
  const [editId, setEditId] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importReport, setImportReport] = useState(null);

  const fetchData = () => {
    Promise.all([
      adminAPI.getHostel(hostelId),
      adminAPI.getRooms(hostelId, { search, status: statusFilter }),
    ])
      .then(([hostelRes, roomsRes]) => {
        setHostel(hostelRes.data.data);
        setRooms(roomsRes.data.data);
      })
      .catch((err) => toast.error(err.message || 'Failed to load rooms'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [hostelId, search, statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        floorNumber: form.floorNumber ? Number(form.floorNumber) : undefined,
      };
      if (editId) {
        await adminAPI.updateRoom(editId, payload);
        toast.success('Room updated');
      } else {
        await adminAPI.createRoom(hostelId, payload);
        toast.success('Room added');
      }
      setModal(null);
      setForm(emptyRoomForm);
      setEditId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room?')) return;
    try {
      await adminAPI.deleteRoom(id);
      toast.success('Room deleted');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return toast.error('Select a file');
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const { data } = await adminAPI.importRooms(hostelId, fd);
      setImportReport(data.data);
      toast.success(`Imported ${data.data.successCount} rooms`);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const downloadTemplate = async () => {
    const { data } = await adminAPI.downloadRoomTemplate();
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'room_import_template.xlsx';
    a.click();
  };

  if (loading) return <Layout navItems={adminNavItems} pageTitle="Admin Portal"><LoadingSpinner className="py-20" /></Layout>;

  return (
    <Layout navItems={adminNavItems} pageTitle="Admin Portal">
      <Link to="/admin/hostels" className="mb-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Hostels
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="page-title">{hostel.name} — Rooms</h2>
          <p className="page-subtitle">
            Code: {hostel.code} · Capacity: {hostel.capacity} · {hostel.roomCount || rooms.length} rooms
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="btn-outline">
            <Download className="h-4 w-4" /> Template
          </button>
          <button onClick={() => { setImportFile(null); setImportReport(null); setModal('import'); }} className="btn-outline">
            <Upload className="h-4 w-4" /> Import
          </button>
          <button onClick={() => { setEditId(null); setForm(emptyRoomForm); setModal('form'); }} className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white">
            <Plus className="h-4 w-4" /> Add Room
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input placeholder="Search room number..." value={search} onChange={(e) => setSearch(e.target.value)} className="field-search" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field-select">
          <option value="">All Statuses</option>
          {ROOM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="panel">
        <table className="w-full text-sm">
          <thead className="panel-head">
            <tr>
              <th className="table-th">Room</th>
              <th className="table-th">Floor</th>
              <th className="table-th">Capacity</th>
              <th className="table-th">Occupied</th>
              <th className="table-th">Vacant</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rooms.map((room) => (
              <tr key={room._id} className="panel-row">
                <td className="px-4 py-3 font-medium">{room.roomNumber}</td>
                <td className="px-4 py-3">{room.floorNumber ?? '-'}</td>
                <td className="px-4 py-3">{room.capacity}</td>
                <td className="px-4 py-3">{room.occupiedSeats ?? room.students?.length ?? 0}</td>
                <td className="table-td text-green-600 dark:text-green-400">{room.vacantSeats ?? room.capacity - (room.students?.length || 0)}</td>
                <td className="table-td">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    room.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                    room.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>{room.status}</span>
                </td>
                <td className="table-td text-right">
                  <button onClick={() => { setEditId(room._id); setForm({ roomNumber: room.roomNumber, floorNumber: room.floorNumber || '', capacity: room.capacity, status: room.status }); setModal('form'); }} className="mr-2 text-blue-600 dark:text-blue-400"><Pencil className="h-4 w-4 inline" /></button>
                  <button onClick={() => handleDelete(room._id)} className="text-red-600 dark:text-red-400"><Trash2 className="h-4 w-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rooms.length === 0 && <p className="py-8 text-center text-slate-500 dark:text-slate-400">No rooms yet. Import or add manually.</p>}
      </div>

      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Room' : 'Add Room'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Room Number" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required className="form-control" />
          <input type="number" placeholder="Floor Number (optional)" value={form.floorNumber} onChange={(e) => setForm({ ...form, floorNumber: e.target.value })} min="0" className="form-control" />
          <input type="number" placeholder="Room Capacity (beds)" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required min="1" className="form-control" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-control">
            {ROOM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="w-full rounded-lg bg-primary-600 py-2.5 text-white">{editId ? 'Update' : 'Add Room'}</button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'import'} onClose={() => setModal(null)} title={`Import Rooms — ${hostel.name}`} size="lg">
        {importReport ? (
          <ImportReport report={importReport} onClose={() => { setImportReport(null); setModal(null); }} />
        ) : (
          <form onSubmit={handleImport} className="space-y-4">
            <p className="page-subtitle">Import rooms for this hostel. File can include Hostel Code for validation.</p>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setImportFile(e.target.files[0])} required className="w-full text-sm" />
            <button type="submit" className="w-full rounded-lg bg-primary-600 py-2.5 text-white">Upload & Import</button>
          </form>
        )}
      </Modal>
    </Layout>
  );
}
