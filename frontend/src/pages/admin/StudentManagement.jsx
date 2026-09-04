import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload, Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/endpoints';
import { adminNavItems, BRANCHES, YEARS, GENDERS, emptyStudentForm } from '../../config/adminNav';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyStudentForm);
  const [editId, setEditId] = useState(null);
  const [importFile, setImportFile] = useState(null);

  const fetchStudents = () => {
    setLoading(true);
    adminAPI
      .getStudents({ search, branch, year, page, limit: 15 })
      .then(({ data }) => {
        setStudents(data.data.students);
        setTotal(data.data.total);
      })
      .catch((err) => toast.error(err.message || 'Failed to load students'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, [search, branch, year, page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editId && !payload.password) delete payload.password;
      if (!editId && !payload.password) payload.password = 'student123';

      if (editId) {
        await adminAPI.updateStudent(editId, payload);
        toast.success('Student updated');
      } else {
        await adminAPI.createStudent(payload);
        toast.success('Student added');
      }
      setModal(null);
      setForm(emptyStudentForm);
      setEditId(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (student) => {
    setEditId(student._id);
    setForm({
      name: student.name,
      regNo: student.regNo,
      rollNo: student.rollNo,
      email: student.email,
      branch: student.branch,
      year: student.year,
      gender: student.gender || 'Male',
      password: '',
    });
    setModal('form');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this student?')) return;
    try {
      await adminAPI.deleteStudent(id);
      toast.success('Student deleted');
      fetchStudents();
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
      const { data } = await adminAPI.importStudents(fd);
      toast.success(`Imported ${data.data.created} students`);
      if (data.data.failed.length) {
        toast.error(`${data.data.failed.length} rows failed`);
      }
      setModal(null);
      setImportFile(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const downloadTemplate = async () => {
    const { data } = await adminAPI.downloadStudentTemplate();
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.xlsx';
    a.click();
  };

  return (
    <Layout navItems={adminNavItems} pageTitle="Admin Portal">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="page-title">Student Management</h2>
          <p className="page-subtitle">Master student database — required before hostel allocation</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="btn-outline">
            <Download className="h-4 w-4" /> Template
          </button>
          <button onClick={() => setModal('import')} className="btn-outline">
            <Upload className="h-4 w-4" /> Import CSV/Excel
          </button>
          <button
            onClick={() => { setEditId(null); setForm(emptyStudentForm); setModal('form'); }}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" /> Add Student
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search name, reg no, roll no, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="field-search"
          />
        </div>
        <select value={branch} onChange={(e) => { setBranch(e.target.value); setPage(1); }} className="field-select">
          <option value="">All Branches</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} className="field-select">
          <option value="">All Years</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <div className="panel">
          <table className="w-full text-sm">
            <thead className="panel-head">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Reg No</th>
                <th className="table-th">Roll No</th>
                <th className="table-th">Email</th>
                <th className="table-th">Branch</th>
                <th className="table-th">Year</th>
                <th className="table-th">Gender</th>
                <th className="table-th">Hostel</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {students.map((s) => (
                <tr key={s._id} className="panel-row">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.regNo}</td>
                  <td className="px-4 py-3">{s.rollNo}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.branch}</td>
                  <td className="px-4 py-3">{s.year}</td>
                  <td className="px-4 py-3">{s.gender || '-'}</td>
                  <td className="px-4 py-3">{s.hostelId?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(s)} className="mr-2 text-blue-600 hover:underline"><Pencil className="h-4 w-4 inline" /></button>
                    <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:underline"><Trash2 className="h-4 w-4 inline" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && <p className="py-8 text-center text-slate-500 dark:text-slate-400">No students found</p>}
        </div>
      )}

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Total: {total} students</p>

      <Modal isOpen={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit Student' : 'Add Student'} size="lg">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {[
            ['name', 'Full Name', 'text'],
            ['regNo', 'Registration Number', 'text'],
            ['rollNo', 'Roll Number', 'text'],
            ['email', 'College Email', 'email'],
          ].map(([key, label, type]) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <input type={type} required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="form-control" />
            </div>
          ))}
          <div>
            <label className="form-label">Branch</label>
            <select required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} className="form-control">
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Academic Year</label>
            <select required value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="form-control">
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Gender</label>
            <select required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="form-control">
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Password {editId && '(leave blank to keep)'}</label>
            <input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="form-control" placeholder={editId ? 'Optional' : 'Default: student123'} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="w-full rounded-lg bg-primary-600 py-2.5 text-white">{editId ? 'Update' : 'Add Student'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modal === 'import'} onClose={() => setModal(null)} title="Import Students (CSV/Excel)">
        <form onSubmit={handleImport} className="space-y-4">
          <p className="page-subtitle">Upload a CSV or Excel file matching the template format.</p>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setImportFile(e.target.files[0])} className="w-full text-sm text-slate-700 dark:text-slate-300" required />
          <button type="submit" className="w-full rounded-lg bg-primary-600 py-2.5 text-white">Upload & Import</button>
        </form>
      </Modal>
    </Layout>
  );
}
