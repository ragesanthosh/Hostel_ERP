import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload, Download, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import ImportReport from '../../components/ImportReport';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/endpoints';
import { adminNavItems, YEARS, emptyAcademicForm } from '../../config/adminNav';

export default function AcademicStructureManagement() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyAcademicForm);
  const [editId, setEditId] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importReport, setImportReport] = useState(null);

  const fetchRecords = () => {
    setLoading(true);
    adminAPI
      .getAcademicStructure({ year: yearFilter, search, page, limit: 15 })
      .then(({ data }) => {
        setRecords(data.data.records);
        setTotal(data.data.total);
      })
      .catch((err) => toast.error(err.message || 'Failed to load academic structure'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, [yearFilter, search, page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        branch: form.branch.toUpperCase(),
        studentStrength: Number(form.studentStrength),
      };
      if (editId) {
        await adminAPI.updateAcademicRecord(editId, payload);
        toast.success('Record updated');
      } else {
        await adminAPI.createAcademicRecord(payload);
        toast.success('Record added');
      }
      setModal(null);
      setForm(emptyAcademicForm);
      setEditId(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (record) => {
    setEditId(record._id);
    setForm({
      year: record.year,
      branch: record.branch,
      studentStrength: record.studentStrength,
    });
    setModal('form');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this branch record?')) return;
    try {
      await adminAPI.deleteAcademicRecord(id);
      toast.success('Record deleted');
      fetchRecords();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const downloadTemplate = async () => {
    const { data } = await adminAPI.downloadAcademicTemplate();
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'academic_structure_template.xlsx';
    a.click();
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return toast.error('Select a file');
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const { data } = await adminAPI.importAcademicStructure(fd);
      setImportReport(data.data);
      toast.success(`Imported ${data.data.successCount} records`);
      fetchRecords();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <Layout navItems={adminNavItems} pageTitle="Admin Portal">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="page-title">Academic Structure Management</h2>
          <p className="page-subtitle">
            Upload branches and student strength per year before hostel branch-year mapping
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadTemplate}
            className="btn-outline"
          >
            <Download className="h-4 w-4" /> Download Template
          </button>
          <button
            onClick={() => {
              setImportFile(null);
              setImportReport(null);
              setModal('import');
            }}
            className="btn-outline"
          >
            <Upload className="h-4 w-4" /> Import Excel/CSV
          </button>
          <button
            onClick={() => {
              setForm(emptyAcademicForm);
              setEditId(null);
              setModal('form');
            }}
            className="flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm text-white"
          >
            <Plus className="h-4 w-4" /> Add Record
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search branch..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="field-search"
          />
        </div>
        <select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            setPage(1);
          }}
          className="field-select px-4 py-2"
        >
          <option value="">All Years</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="panel overflow-hidden">
        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : (
          <table className="w-full text-sm">
            <thead className="panel-head">
              <tr>
                <th className="table-th">Academic Year</th>
                <th className="table-th">Branch</th>
                <th className="table-th">Student Strength</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r) => (
                <tr key={r._id} className="panel-row">
                  <td className="px-4 py-3">{r.year}</td>
                  <td className="px-4 py-3 font-medium">{r.branch}</td>
                  <td className="px-4 py-3">{r.studentStrength}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(r)}
                      className="icon-btn-edit mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="icon-btn-delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                    No academic structure records. Upload an Excel/CSV file or add records manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-outline disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-outline disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <Modal
        isOpen={modal === 'form'}
        onClose={() => setModal(null)}
        title={editId ? 'Edit Branch Record' : 'Add Branch Record'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            required
            className="form-control"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <input
            placeholder="Branch Name (e.g. CSE)"
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value.toUpperCase() })}
            required
            className="form-control"
          />
          <input
            type="number"
            placeholder="Student Strength"
            value={form.studentStrength}
            onChange={(e) => setForm({ ...form, studentStrength: e.target.value })}
            required
            min="1"
            className="form-control"
          />
          <button type="submit" className="w-full rounded-lg bg-primary-600 py-2.5 text-white">
            {editId ? 'Update' : 'Add'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'import'} onClose={() => setModal(null)} title="Import Academic Structure" size="lg">
        {importReport ? (
          <ImportReport report={importReport} onClose={() => { setImportReport(null); setModal(null); }} />
        ) : (
          <form onSubmit={handleImport} className="space-y-4">
            <p className="page-subtitle">
              Upload Excel/CSV with columns: Academic Year, Branch, Student Strength.
              Existing year-branch pairs will be updated.
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files[0])}
              required
              className="w-full text-sm text-slate-700 dark:text-slate-300"
            />
            <button type="submit" className="w-full rounded-lg bg-primary-600 py-2.5 text-white">
              Upload & Import
            </button>
          </form>
        )}
      </Modal>
    </Layout>
  );
}
