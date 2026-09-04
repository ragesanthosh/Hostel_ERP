import api from './api';

export const authAPI = {
  loginAdmin: (data) => api.post('/auth/admin/login', data),
  loginStudent: (data) => api.post('/auth/student/login', data),
  loginWarden: (data) => api.post('/auth/warden/login', data),
  getMe: () => api.get('/auth/me'),
  updateAdminProfile: (data) => api.put('/auth/admin/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllocationOverview: () => api.get('/admin/allocation-overview'),
  getBranchStrengths: (year) =>
    api.get('/admin/branch-strengths', { params: year ? { year } : {} }),
  getAllMappings: () => api.get('/admin/mappings'),
  updateMapping: (id, data) => api.put(`/admin/mappings/${id}`, data),
  deleteMapping: (id) => api.delete(`/admin/mappings/${id}`),
  getAcademicStructure: (params) => api.get('/admin/academic-structure', { params }),
  getAcademicYears: () => api.get('/admin/academic-structure/years'),
  getAcademicStatus: () => api.get('/admin/academic-structure/status'),
  getAcademicBranchesByYear: (year) =>
    api.get(`/admin/academic-structure/by-year/${encodeURIComponent(year)}`),
  createAcademicRecord: (data) => api.post('/admin/academic-structure', data),
  updateAcademicRecord: (id, data) => api.put(`/admin/academic-structure/${id}`, data),
  deleteAcademicRecord: (id) => api.delete(`/admin/academic-structure/${id}`),
  importAcademicStructure: (formData) =>
    api.post('/admin/academic-structure/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  downloadAcademicTemplate: () =>
    api.get('/admin/academic-structure/template', { responseType: 'blob' }),
  getStudents: (params) => api.get('/admin/students', { params }),
  createStudent: (data) => api.post('/admin/students', data),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  importStudents: (formData) =>
    api.post('/admin/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  downloadStudentTemplate: () =>
    api.get('/admin/students/template', { responseType: 'blob' }),
  getWardens: (params) => api.get('/admin/wardens', { params }),
  getAvailableWardens: () => api.get('/admin/wardens/available'),
  createWarden: (data) => api.post('/admin/wardens', data),
  updateWarden: (id, data) => api.put(`/admin/wardens/${id}`, data),
  deleteWarden: (id) => api.delete(`/admin/wardens/${id}`),
  assignWardenToHostel: (hostelId, wardenId) =>
    api.post(`/admin/hostels/${hostelId}/assign-warden-by-id`, { wardenId }),
  unassignWardenFromHostel: (hostelId) => api.delete(`/admin/hostels/${hostelId}/warden`),
  downloadHostelTemplate: () => api.get('/admin/hostels/template', { responseType: 'blob' }),
  importHostels: (formData) =>
    api.post('/admin/hostels/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHostelsList: (params) => api.get('/admin/hostels/list', { params }),
  createHostel: (data) => api.post('/admin/hostels', data),
  getHostel: (id) => api.get(`/admin/hostels/${id}`),
  updateHostel: (id, data) => api.put(`/admin/hostels/${id}`, data),
  deleteHostel: (id) => api.delete(`/admin/hostels/${id}`),
  recalculateHostelCapacity: (hostelId) => api.post(`/admin/hostels/${hostelId}/recalculate-capacity`),
  downloadRoomTemplate: () => api.get('/admin/rooms/template', { responseType: 'blob' }),
  importRoomsGlobal: (formData) =>
    api.post('/admin/rooms/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getRooms: (hostelId, params) => api.get(`/admin/hostels/${hostelId}/rooms`, { params }),
  createRoom: (hostelId, data) => api.post(`/admin/hostels/${hostelId}/rooms`, data),
  importRooms: (hostelId, formData) =>
    api.post(`/admin/hostels/${hostelId}/rooms/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateRoom: (roomId, data) => api.put(`/admin/rooms/${roomId}`, data),
  deleteRoom: (roomId) => api.delete(`/admin/rooms/${roomId}`),
  assignWarden: (id, data) => api.post(`/admin/hostels/${id}/assign-warden`, data),
  createMapping: (id, data) => api.post(`/admin/hostels/${id}/mappings`, data),
  getHostelMappings: (id) => api.get(`/admin/hostels/${id}/mappings`),
};

export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  getGroup: () => api.get('/student/group'),
  resetGroup: () => api.post('/student/group/reset'),
  createGroup: (data) => api.post('/student/group', data),
  inviteRoommates: (data) => api.post('/student/group/invite', data),
  respondInvitation: (id, data) => api.put(`/student/invitations/${id}/respond`, data),
  getAvailableRooms: () => api.get('/student/rooms'),
  selectRoom: (data) => api.post('/student/rooms/select', data),
  getDocuments: (groupId) => api.get(`/student/group/${groupId}/documents`),
  uploadDocuments: (formData) =>
    api.post('/student/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const wardenAPI = {
  getDashboard: () => api.get('/warden/dashboard'),
  getStudents: () => api.get('/warden/students'),
  getRooms: () => api.get('/warden/rooms'),
  getDocuments: () => api.get('/warden/documents'),
  getStudentDocuments: (studentId) => api.get(`/warden/students/${studentId}/documents`),
  verifyDocument: (id, data) => api.put(`/warden/documents/${id}/verify`, data),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};
