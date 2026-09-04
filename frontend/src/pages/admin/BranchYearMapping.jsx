import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/endpoints';
import { adminNavItems } from '../../config/adminNav';

const mappingHostelId = (m) => String(m.hostelId?._id || m.hostelId || '');

export default function BranchYearMapping() {
  const [hostels, setHostels] = useState([]);
  const [branches, setBranches] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicConfigured, setAcademicConfigured] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMapping, setEditMapping] = useState(null);
  const [editHostelId, setEditHostelId] = useState('');

  useEffect(() => {
    Promise.all([
      adminAPI.getDashboard(),
      adminAPI.getAcademicStatus(),
      adminAPI.getAcademicYears(),
      adminAPI.getAllMappings(),
    ])
      .then(([dash, statusRes, yearsRes, mappingData]) => {
        setHostels(dash.data.data.hostels);
        setAcademicConfigured(statusRes.data.data.configured);
        setAcademicYears(yearsRes.data.data);
        setMappings(mappingData.data.data);
      })
      .catch((err) => toast.error(err.message || 'Failed to load mapping data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedYear) {
      setBranches([]);
      setSelectedBranches([]);
      return;
    }
    adminAPI
      .getAcademicBranchesByYear(selectedYear)
      .then(({ data }) => setBranches(data.data))
      .catch((err) => toast.error(err.message || 'Failed to load branches'));
    setSelectedBranches([]);
  }, [selectedYear]);

  const handleSubmit = async () => {
    if (!selectedHostel || !selectedYear || selectedBranches.length === 0) {
      toast.error('Please select hostel, year, and at least one branch');
      return;
    }
    try {
      const { data } = await adminAPI.createMapping(selectedHostel, {
        year: selectedYear,
        branches: selectedBranches,
      });
      setMappings((prev) => [...prev, ...data.data]);
      toast.success('Mappings created successfully');
      setSelectedBranches([]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openEdit = (mapping) => {
    setEditMapping(mapping);
    setEditHostelId(mappingHostelId(mapping));
  };

  const handleUpdateMapping = async (e) => {
    e.preventDefault();
    if (!editHostelId) return toast.error('Select a hostel');
    try {
      const { data } = await adminAPI.updateMapping(editMapping._id, { hostelId: editHostelId });
      setMappings((prev) => prev.map((m) => (m._id === editMapping._id ? data.data : m)));
      toast.success('Mapping updated');
      setEditMapping(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteMapping = async (mapping) => {
    if (!confirm(`Delete mapping for ${mapping.year} - ${mapping.branch}?`)) return;
    try {
      await adminAPI.deleteMapping(mapping._id);
      setMappings((prev) => prev.filter((m) => m._id !== mapping._id));
      toast.success('Mapping deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <Layout navItems={adminNavItems} pageTitle="Admin Portal">
        <LoadingSpinner className="py-20" />
      </Layout>
    );
  }

  const hostelsWithWarden = hostels.filter((h) => h.wardenId);
  const selectedHostelData = hostels.find((h) => h._id === selectedHostel);
  const hostelCapacity = selectedHostelData?.capacity || 0;
  const hostelIdStr = String(selectedHostel);

  const allocatedToHostel = mappings
    .filter((m) => mappingHostelId(m) === hostelIdStr)
    .reduce((sum, m) => sum + (m.studentStrength || 0), 0);

  const getStrength = (branchName) =>
    branches.find((b) => b.branch === branchName)?.studentStrength || 0;

  const totalSelected = selectedBranches.reduce(
    (sum, branchName) => sum + getStrength(branchName),
    0
  );

  const remCapacity = hostelCapacity - allocatedToHostel - totalSelected;

  const editTargetHostel = hostelsWithWarden.find((h) => h._id === editHostelId);
  const editAllocatedExcluding =
    editMapping && editHostelId
      ? mappings
          .filter(
            (m) =>
              mappingHostelId(m) === String(editHostelId) && m._id !== editMapping._id
          )
          .reduce((sum, m) => sum + (m.studentStrength || 0), 0)
      : 0;
  const editRemCapacity = editTargetHostel
    ? editTargetHostel.capacity - editAllocatedExcluding - (editMapping?.studentStrength || 0)
    : 0;

  const toggleBranch = (branchName, strength) => {
    setSelectedBranches((prev) => {
      if (prev.includes(branchName)) {
        return prev.filter((b) => b !== branchName);
      }
      const currentTotal = prev.reduce((sum, name) => sum + getStrength(name), 0);
      const available = hostelCapacity - allocatedToHostel - currentTotal;
      if (strength > available) {
        toast.error(
          `Cannot select ${branchName} — strength (${strength}) exceeds remaining capacity (${available})`
        );
        return prev;
      }
      return [...prev, branchName];
    });
  };

  const mappingsByHostel = mappings.reduce((acc, m) => {
    const id = mappingHostelId(m);
    if (!acc[id]) {
      const hostel = hostels.find((h) => h._id === id) || m.hostelId;
      acc[id] = {
        id,
        name: hostel?.name || 'Unknown Hostel',
        code: hostel?.code,
        capacity: hostel?.capacity || m.hostelId?.capacity || 0,
        mappings: [],
      };
    }
    acc[id].mappings.push(m);
    return acc;
  }, {});

  const hostelMappingSets = Object.values(mappingsByHostel)
    .map((group) => ({
      ...group,
      totalStrength: group.mappings.reduce((sum, m) => sum + (m.studentStrength || 0), 0),
      mappings: [...group.mappings].sort(
        (a, b) => a.year.localeCompare(b.year) || a.branch.localeCompare(b.branch)
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Layout navItems={adminNavItems} pageTitle="Admin Portal">
      <h2 className="page-title mb-2">Branch-Year Hostel Allocation</h2>
      <p className="page-subtitle mb-6">
        Select branches whose strength fits within the hostel&apos;s remaining capacity
      </p>

      {!academicConfigured && (
        <div className="alert-error mb-6">
          Academic structure is not configured.{' '}
          <Link to="/admin/academic" className="font-medium underline">
            Upload academic structure
          </Link>{' '}
          before creating hostel mappings.
        </div>
      )}

      {hostelsWithWarden.length === 0 && (
        <div className="alert-warning mb-6">
          No hostels have wardens assigned. Go to Hostel Management and assign wardens first.
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="content-card p-6">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Create Mapping</h3>

          <div className="space-y-4">
            <div>
              <label className="form-label">Select Hostel</label>
              <select
                value={selectedHostel}
                onChange={(e) => {
                  setSelectedHostel(e.target.value);
                  setSelectedBranches([]);
                }}
                disabled={!academicConfigured}
                className="form-control"
              >
                <option value="">Choose hostel...</option>
                {hostelsWithWarden.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} (Warden: {h.wardenId?.name}) — Capacity: {h.capacity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Select Academic Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={!academicConfigured}
                className="form-control"
              >
                <option value="">Choose year...</option>
                {academicYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {selectedHostel && selectedYear && (
              <div>
                <label className="form-label mb-2">
                  Branches for {selectedYear}
                </label>
                {branches.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    No branches configured for {selectedYear}.{' '}
                    <Link to="/admin/academic" className="text-primary-600 underline dark:text-primary-400">
                      Add in Academic Structure
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {branches.map((b) => {
                      const mapped = mappings.some(
                        (m) => m.branch === b.branch && m.year === selectedYear
                      );
                      const isSelected = selectedBranches.includes(b.branch);
                      const availableNow = remCapacity + (isSelected ? b.studentStrength : 0);
                      const canSelect = !mapped && b.studentStrength <= availableNow;

                      return (
                        <label
                          key={b._id}
                          className={`flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 dark:border-slate-600 ${
                            mapped || !canSelect
                              ? 'bg-slate-100 opacity-60 dark:bg-slate-800'
                              : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleBranch(b.branch, b.studentStrength)}
                              disabled={mapped || (!isSelected && !canSelect)}
                            />
                            <span className="font-medium text-slate-900 dark:text-slate-100">{b.branch}</span>
                          </div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            Strength: {b.studentStrength}
                            {mapped && (
                              <span className="ml-2 text-xs text-slate-400">Already mapped</span>
                            )}
                            {!mapped && !canSelect && !isSelected && (
                              <span className="ml-2 text-xs text-red-500 dark:text-red-400">
                                Needs {b.studentStrength}, only {availableNow} left
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {branches.length > 0 && (
                  <>
                    <div className="alert-info mt-4">
                      <p className="text-slate-700 dark:text-slate-300">
                        Hostel capacity: <strong>{hostelCapacity}</strong>
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        Already allocated: <strong>{allocatedToHostel}</strong>
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        Currently selected: <strong>{totalSelected}</strong>
                      </p>
                      <p className="font-medium text-primary-700 dark:text-primary-300">
                        Remaining capacity: <strong>{remCapacity}</strong>
                      </p>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={
                        !academicConfigured ||
                        selectedBranches.length === 0 ||
                        totalSelected > hostelCapacity - allocatedToHostel
                      }
                      className="mt-4 w-full rounded-lg bg-primary-600 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      Create Mappings
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="content-card p-6">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Existing Mappings by Hostel</h3>
          <div className="max-h-[32rem] space-y-4 overflow-y-auto">
            {hostelMappingSets.map((group) => {
              const remaining = group.capacity - group.totalStrength;
              return (
                <div key={group.id} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between bg-primary-50 px-4 py-3 dark:bg-primary-950/50">
                    <div>
                      <p className="font-semibold text-primary-900 dark:text-primary-200">{group.name}</p>
                      {group.code && (
                        <p className="text-xs font-medium text-primary-600 dark:text-primary-400">{group.code}</p>
                      )}
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-medium text-primary-800 dark:text-primary-300">
                        {group.totalStrength} / {group.capacity} allocated
                      </p>
                      <p className={remaining >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over`}
                      </p>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-600">
                    {group.mappings.map((m) => (
                      <div
                        key={m._id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {m.year} — {m.branch}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Strength: {m.studentStrength}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(m)}
                            className="icon-btn-edit"
                            title="Edit mapping"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMapping(m)}
                            className="icon-btn-delete"
                            title="Delete mapping"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {hostelMappingSets.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No mappings yet</p>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!editMapping}
        onClose={() => setEditMapping(null)}
        title="Edit Mapping"
      >
        {editMapping && (
          <form onSubmit={handleUpdateMapping} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-700/50">
              <p>
                <span className="text-slate-500 dark:text-slate-400">Year:</span>{' '}
                <span className="text-slate-900 dark:text-slate-100">{editMapping.year}</span>
              </p>
              <p>
                <span className="text-slate-500 dark:text-slate-400">Branch:</span>{' '}
                <span className="text-slate-900 dark:text-slate-100">{editMapping.branch}</span>
              </p>
              <p>
                <span className="text-slate-500 dark:text-slate-400">Strength:</span>{' '}
                <span className="text-slate-900 dark:text-slate-100">{editMapping.studentStrength}</span>
              </p>
            </div>

            <div>
              <label className="form-label">Assigned Hostel</label>
              <select
                value={editHostelId}
                onChange={(e) => setEditHostelId(e.target.value)}
                required
                className="form-control"
              >
                <option value="">Choose hostel...</option>
                {hostelsWithWarden.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} — Capacity: {h.capacity}
                  </option>
                ))}
              </select>
            </div>

            {editHostelId && (
              <p
                className={`text-sm ${editRemCapacity >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {editRemCapacity >= 0
                  ? `${editRemCapacity} capacity remaining after this mapping`
                  : `Exceeds capacity by ${Math.abs(editRemCapacity)}`}
              </p>
            )}

            <button
              type="submit"
              disabled={!editHostelId || editRemCapacity < 0}
              className="w-full rounded-lg bg-primary-600 py-2.5 text-white disabled:opacity-50"
            >
              Save Changes
            </button>
          </form>
        )}
      </Modal>
    </Layout>
  );
}
