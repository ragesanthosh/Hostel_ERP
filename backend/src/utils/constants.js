export const GENDERS = ['Male', 'Female', 'Other'];

export const BRANCHES = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT', 'AI&DS'];

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const BRANCH_STRENGTH = {
  CSE: 280,
  ECE: 220,
  MECH: 180,
  CIVIL: 120,
  EEE: 150,
  IT: 200,
  'AI&DS': 160,
};

export const DOCUMENT_TYPES = ['fee_receipt', 'college_id', 'aadhaar', 'passport_photo'];

export const DOCUMENT_LABELS = {
  fee_receipt: 'Fee Receipt',
  college_id: 'College ID',
  aadhaar: 'Aadhaar',
  passport_photo: 'Passport Size Photo',
};

export const GROUP_STATUSES = ['forming', 'pending_invites', 'active', 'invalid', 'allocated'];

export const INVITATION_EXPIRY_HOURS = 72;

export const STUDENT_IMPORT_COLUMNS = {
  name: ['full name', 'name', 'full_name', 'student name'],
  regNo: ['registration number', 'reg no', 'regno', 'reg_no', 'registration no'],
  rollNo: ['roll number', 'roll no', 'rollno', 'roll_no'],
  email: ['college email', 'email', 'e-mail'],
  branch: ['branch'],
  year: ['academic year', 'year'],
  gender: ['gender', 'sex'],
  password: ['password', 'default password'],
};
