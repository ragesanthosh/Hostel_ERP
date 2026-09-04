import XLSX from 'xlsx';
import { BRANCHES, YEARS, GENDERS, STUDENT_IMPORT_COLUMNS } from './constants.js';

const normalizeKey = (key) => key?.toString().trim().toLowerCase();

const mapRow = (row) => {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeKey(key)] = value?.toString().trim();
  }

  const getValue = (aliases) => {
    for (const alias of aliases) {
      if (normalized[alias]) return normalized[alias];
    }
    return '';
  };

  const yearRaw = getValue(STUDENT_IMPORT_COLUMNS.year);
  const year = YEARS.find((y) => y.toLowerCase() === yearRaw.toLowerCase()) || yearRaw;

  const branchRaw = getValue(STUDENT_IMPORT_COLUMNS.branch).toUpperCase();
  const branch = BRANCHES.find((b) => b.toUpperCase() === branchRaw) || branchRaw;

  const genderRaw = getValue(STUDENT_IMPORT_COLUMNS.gender);
  const gender =
    GENDERS.find((g) => g.toLowerCase() === genderRaw.toLowerCase()) ||
    (genderRaw.toLowerCase() === 'm' ? 'Male' : genderRaw.toLowerCase() === 'f' ? 'Female' : genderRaw);

  return {
    name: getValue(STUDENT_IMPORT_COLUMNS.name),
    regNo: getValue(STUDENT_IMPORT_COLUMNS.regNo),
    rollNo: getValue(STUDENT_IMPORT_COLUMNS.rollNo),
    email: getValue(STUDENT_IMPORT_COLUMNS.email),
    branch,
    year,
    gender,
    password: getValue(STUDENT_IMPORT_COLUMNS.password) || 'student123',
  };
};

const readWorkbook = (input) =>
  typeof input === 'string' ? XLSX.readFile(input) : XLSX.read(input, { type: 'buffer' });

export const parseStudentFile = (input, filename) => {
  const workbook = readWorkbook(input);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows.length) {
    throw new Error('File is empty or has no data rows');
  }

  return rows.map(mapRow).filter((r) => r.name || r.regNo || r.email);
};

export const generateStudentTemplate = () => {
  const headers = [
    'Full Name',
    'Registration Number',
    'Roll Number',
    'College Email',
    'Branch',
    'Academic Year',
    'Gender',
    'Password',
  ];
  const sample = [
    'John Doe',
    'REG2025001',
    '22CSE001',
    'john@college.edu',
    'CSE',
    '2nd Year',
    'Male',
    'student123',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
