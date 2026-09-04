import { useState, useEffect, useMemo } from 'react';
import { Home, Users, DoorOpen, FileText, Check, X, ExternalLink, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { wardenAPI } from '../../services/endpoints';

const navItems = [
  { path: '/warden', label: 'Dashboard', icon: Home },
  { path: '/warden/students', label: 'Student List', icon: Users },
  { path: '/warden/rooms', label: 'Room Status', icon: DoorOpen },
  { path: '/warden/documents', label: 'Documents', icon: FileText },
];

const DOC_LABELS = {
  fee_receipt: 'Fee Receipt',
  college_id: 'College ID',
  aadhaar: 'Aadhaar',
  passport_photo: 'Passport Photo',
};

export default function DocumentViewer() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    wardenAPI.getDocuments().then(({ data }) => {
      setDocuments(data.data);
      setLoading(false);
    });
  }, []);

  const handleVerify = async (docId, verified) => {
    try {
      await wardenAPI.verifyDocument(docId, { verified });
      toast.success(verified ? 'Document verified' : 'Verification removed');
      setDocuments((prev) =>
        prev.map((d) => (d._id === docId ? { ...d, verified } : d))
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const grouped = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const userId = doc.userId?._id || doc.userId;
      if (!acc[userId]) acc[userId] = { user: doc.userId, docs: [] };
      acc[userId].docs.push(doc);
      return acc;
    }, {});
  }, [documents]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const groups = Object.values(grouped);
    if (!term) return groups;

    return groups.filter(({ user, docs }) => {
      const userHaystack = [user?.name, user?.regNo, user?.rollNo, user?.branch, user?.year, user?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const docHaystack = docs
        .map((doc) => DOC_LABELS[doc.type] || doc.type)
        .join(' ')
        .toLowerCase();

      return userHaystack.includes(term) || docHaystack.includes(term);
    });
  }, [grouped, search]);

  if (loading) return <Layout navItems={navItems} pageTitle="Warden Portal"><LoadingSpinner className="py-20" /></Layout>;

  return (
    <Layout navItems={navItems} pageTitle="Warden Portal">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Document Management</h2>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-slate-700 dark:text-slate-300">
          {filteredGroups.length} of {Object.keys(grouped).length} student{Object.keys(grouped).length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          placeholder="Search student name, reg no, roll no, document type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-search"
        />
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-8 text-center text-gray-500 dark:bg-slate-800 dark:text-slate-400">
          No documents uploaded yet
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-8 text-center text-gray-500 dark:bg-slate-800 dark:text-slate-400">
          No documents match your search.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map(({ user, docs }) => (
            <div key={user._id} className="glass-card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{user.regNo} | {user.branch} | {user.year}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {docs.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-600">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{DOC_LABELS[doc.type]}</p>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.verified ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Check className="h-4 w-4" /> Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerify(doc._id, true)}
                          className="rounded-lg bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
                        >
                          Verify
                        </button>
                      )}
                      {doc.verified && (
                        <button
                          onClick={() => handleVerify(doc._id, false)}
                          className="rounded-lg p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
