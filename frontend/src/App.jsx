import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

import StudentManagement from './pages/admin/StudentManagement';
import WardenManagement from './pages/admin/WardenManagement';
import AcademicStructureManagement from './pages/admin/AcademicStructureManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import HostelManagement from './pages/admin/HostelManagement';
import RoomManagement from './pages/admin/RoomManagement';
import BranchYearMapping from './pages/admin/BranchYearMapping';
import AllocationOverview from './pages/admin/AllocationOverview';
import AdminProfile from './pages/admin/AdminProfile';

import StudentDashboard from './pages/student/StudentDashboard';
import ChangePassword from './pages/ChangePassword';
import GroupRoomPage from './pages/student/GroupRoomPage';
import DocumentUpload from './pages/student/DocumentUpload';
import AllocationConfirmation from './pages/student/AllocationConfirmation';

import WardenDashboard from './pages/warden/WardenDashboard';
import StudentList from './pages/warden/StudentList';
import RoomStatus from './pages/warden/RoomStatus';
import DocumentViewer from './pages/warden/DocumentViewer';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><StudentManagement /></ProtectedRoute>} />
          <Route path="/admin/wardens" element={<ProtectedRoute allowedRoles={['admin']}><WardenManagement /></ProtectedRoute>} />
          <Route path="/admin/academic" element={<ProtectedRoute allowedRoles={['admin']}><AcademicStructureManagement /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/hostels" element={<ProtectedRoute allowedRoles={['admin']}><HostelManagement /></ProtectedRoute>} />
          <Route path="/admin/hostels/:hostelId/rooms" element={<ProtectedRoute allowedRoles={['admin']}><RoomManagement /></ProtectedRoute>} />
          <Route path="/admin/mappings" element={<ProtectedRoute allowedRoles={['admin']}><BranchYearMapping /></ProtectedRoute>} />
          <Route path="/admin/overview" element={<ProtectedRoute allowedRoles={['admin']}><AllocationOverview /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><AdminProfile /></ProtectedRoute>} />

          <Route path="/student/change-password" element={<ProtectedRoute allowedRoles={['student']}><ChangePassword role="student" /></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/group" element={<ProtectedRoute allowedRoles={['student']}><GroupRoomPage /></ProtectedRoute>} />
          <Route path="/student/documents" element={<ProtectedRoute allowedRoles={['student']}><DocumentUpload /></ProtectedRoute>} />
          <Route path="/student/confirmation" element={<ProtectedRoute allowedRoles={['student']}><AllocationConfirmation /></ProtectedRoute>} />

          <Route path="/warden/change-password" element={<ProtectedRoute allowedRoles={['warden']}><ChangePassword role="warden" /></ProtectedRoute>} />
          <Route path="/warden" element={<ProtectedRoute allowedRoles={['warden']}><WardenDashboard /></ProtectedRoute>} />
          <Route path="/warden/students" element={<ProtectedRoute allowedRoles={['warden']}><StudentList /></ProtectedRoute>} />
          <Route path="/warden/rooms" element={<ProtectedRoute allowedRoles={['warden']}><RoomStatus /></ProtectedRoute>} />
          <Route path="/warden/documents" element={<ProtectedRoute allowedRoles={['warden']}><DocumentViewer /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
