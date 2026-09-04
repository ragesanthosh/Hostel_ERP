import { Users, UserCheck, LayoutDashboard, Building, Map, BarChart3, GraduationCap, UserCircle } from 'lucide-react';

export const adminNavItems = [
  { path: '/admin/students', label: 'Student Management', icon: Users },
  { path: '/admin/wardens', label: 'Warden Management', icon: UserCheck },
  { path: '/admin/academic', label: 'Academic Structure', icon: GraduationCap },
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/hostels', label: 'Hostel Management', icon: Building },
  { path: '/admin/mappings', label: 'Branch-Year Mapping', icon: Map },
  { path: '/admin/overview', label: 'Allocation Overview', icon: BarChart3 },
  { path: '/admin/profile', label: 'Admin Profile', icon: UserCircle },
];

export const BRANCHES = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT', 'AI&DS'];
export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
export const GENDERS = ['Male', 'Female', 'Other'];

export const HOSTEL_GENDERS = ['Boys', 'Girls', 'Mixed'];
export const HOSTEL_STATUSES = ['Active', 'Inactive'];
export const ROOM_STATUSES = ['Active', 'Inactive', 'Under Maintenance'];

export const emptyStudentForm = {
  name: '',
  regNo: '',
  rollNo: '',
  email: '',
  branch: 'CSE',
  year: '1st Year',
  gender: 'Male',
  password: '',
};

export const emptyWardenForm = {
  name: '',
  employeeId: '',
  email: '',
  mobile: '',
  pin: '',
  password: '',
};

export const emptyHostelForm = {
  name: '',
  code: '',
  capacity: '',
  floors: '',
  gender: 'Mixed',
  status: 'Active',
};

export const emptyRoomForm = {
  roomNumber: '',
  floorNumber: '',
  capacity: '',
  status: 'Active',
};

export const emptyAcademicForm = {
  year: '1st Year',
  branch: '',
  studentStrength: '',
};
