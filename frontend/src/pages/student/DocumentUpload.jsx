import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, FileUp, CheckCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { studentAPI } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/student', label: 'Dashboard', icon: Home },
  { path: '/student/group', label: 'Group & Room', icon: Users },
  { path: '/student/documents', label: 'Documents', icon: FileUp },
  { path: '/student/confirmation', label: 'Confirmation', icon: CheckCircle },
];

const DOC_TYPES = [
  { key: 'fee_receipt', label: 'Fee Receipt' },
  { key: 'college_id', label: 'College ID' },
  { key: 'aadhaar', label: 'Aadhaar' },
  { key: 'passport_photo', label: 'Passport Size Photo' },
];

export default function DocumentUpload() {
  const { user, refreshUser } = useAuth();
  const [group, setGroup] = useState(null);
  const [existingDocs, setExistingDocs] = useState([]);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await studentAPI.getGroup();
        const g = data.data;
        setGroup(g);
        if (g?._id && !g.documentsSubmitted) {
          const docsRes = await studentAPI.getDocuments(g._id);
          setExistingDocs(docsRes.data.data || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isLeader = group?.leaderId?._id === user?._id || group?.leaderId === user?._id;
  const isComplete = group?.documentsSubmitted || user?.isRoomAllocated;

  const handleFileChange = (memberId, docType, file) => {
    setFiles((prev) => ({
      ...prev,
      [`${memberId}|${docType}`]: file,
    }));
  };

  const handleSubmit = async () => {
    if (!group || isComplete) return;

    const members = group.members || [];
    const requiredCount = members.length * DOC_TYPES.length;
    const uploadedCount = Object.keys(files).length;

    if (uploadedCount < requiredCount) {
      toast.error(`Please upload all ${requiredCount} documents`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('groupId', group._id);

      Object.entries(files).forEach(([key, file]) => {
        formData.append(key, file);
      });

      const { data } = await studentAPI.uploadDocuments(formData);
      if (data.data.allComplete) {
        toast.success('All documents submitted! Room allocation complete.');
        await refreshUser();
        const { data: groupData } = await studentAPI.getGroup();
        setGroup(groupData.data);
      } else {
        toast.success('Documents uploaded. Upload remaining documents.');
        const docsRes = await studentAPI.getDocuments(group._id);
        setExistingDocs(docsRes.data.data || []);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout navItems={navItems} pageTitle="Documents">
        <LoadingSpinner className="py-20" />
      </Layout>
    );
  }

  if (!group || (group.status !== 'allocated' && !isComplete)) {
    return (
      <Layout navItems={navItems} pageTitle="Documents">
        <Card className="border-amber-200 bg-amber-50/50 text-center">
          <p className="text-amber-800">Please select a room before uploading documents.</p>
          <Link to="/student/group" className="mt-4 inline-block">
            <Button size="sm">Go to Room Selection</Button>
          </Link>
        </Card>
      </Layout>
    );
  }

  if (isComplete) {
    return (
      <Layout navItems={navItems} pageTitle="Documents">
        <Card className="border-emerald-200 bg-emerald-50/30 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h3 className="mt-4 text-lg font-semibold text-emerald-900">Documents Submitted</h3>
          <p className="mt-2 text-sm text-slate-600">
            All documents have been uploaded and your room allocation is complete.
            {(user?.roomId?.roomNumber || group?.roomId?.roomNumber) && (
              <> You have been assigned <strong>Room {user?.roomId?.roomNumber || group?.roomId?.roomNumber}</strong>.</>
            )}
          </p>
          {user?.documentsVerified ? (
            <Badge variant="success" className="mt-4">Verified by warden</Badge>
          ) : (
            <Badge variant="warning" className="mt-4">Pending warden verification</Badge>
          )}
          <Link to="/student/confirmation" className="mt-6 inline-block">
            <Button>View Confirmation</Button>
          </Link>
        </Card>
      </Layout>
    );
  }

  if (!isLeader) {
    return (
      <Layout navItems={navItems} pageTitle="Documents">
        <Card className="card-sky text-center">
          <p className="text-sky-800 dark:text-sky-200">Only the group leader can upload documents. Please wait for your leader to upload.</p>
        </Card>
      </Layout>
    );
  }

  const hasPartialUploads = existingDocs.length > 0;

  return (
    <Layout navItems={navItems} pageTitle="Documents">
      <h2 className="page-title mb-2 text-xl">Document Upload</h2>
      <p className="page-subtitle mb-6">Upload documents for all group members (one set per person)</p>

      {hasPartialUploads && (
        <Card className="mb-6 card-amber">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {existingDocs.length} document(s) already uploaded. Complete the remaining uploads below.
          </p>
        </Card>
      )}

      <div className="space-y-6">
        {(group.members || []).map((member, idx) => {
          const memberId = member._id || member;
          const memberName = member.name || `Member ${idx + 1}`;
          const memberDocs = existingDocs.filter(
            (d) => (d.userId?._id || d.userId)?.toString() === memberId.toString()
          );

          return (
            <Card key={memberId}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{memberName}</h3>
                <Badge variant={memberDocs.length >= DOC_TYPES.length ? 'success' : 'default'}>
                  {memberDocs.length}/{DOC_TYPES.length} uploaded
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {DOC_TYPES.map((doc) => {
                  const uploaded = memberDocs.find((d) => d.type === doc.key);
                  return (
                    <div key={doc.key}>
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        {doc.label}
                        {uploaded && <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">✓ Uploaded</span>}
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileChange(memberId, doc.key, e.target.files[0])}
                        className="w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-primary-700"
                      />
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <Button onClick={handleSubmit} loading={submitting} className="mt-6 w-full">
        Submit All Documents
      </Button>
    </Layout>
  );
}
