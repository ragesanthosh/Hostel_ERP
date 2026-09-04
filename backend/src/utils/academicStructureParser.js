import XLSX from 'xlsx';
import { YEARS } from './constants.js';

const COLUMN_ALIASES = {
  year: ['academic year', 'year', 'academic_year'],
  branch: ['branch name', 'branch', 'branch_name'],
  strength: ['total number of students', 'student strength', 'strength', 'students', 'total students'],
};

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

  const yearRaw = getValue(COLUMN_ALIASES.year);
  const year = YEARS.find((y) => y.toLowerCase() === yearRaw.toLowerCase()) || yearRaw;

  const branch = getValue(COLUMN_ALIASES.branch).toUpperCase();
  const strengthRaw = getValue(COLUMN_ALIASES.strength);

  return { year, branch, studentStrength: strengthRaw ? Number(strengthRaw) : NaN };
};

export const parseAcademicStructureFile = (input) => {
  const workbook = typeof input === 'string' ? XLSX.readFile(input) : XLSX.read(input, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows.length) {
    throw new Error('File is empty or has no data rows');
  }

  return rows.map(mapRow).filter((r) => r.year || r.branch);
};

export const generateAcademicStructureTemplate = () => {
  const headers = ['Academic Year', 'Branch', 'Student Strength'];
  const samples = [
    ['1st Year', 'CSE', 280],
    ['1st Year', 'ECE', 220],
    ['2nd Year', 'CSE', 265],
    ['2nd Year', 'MECH', 180],
    ['3rd Year', 'CIVIL', 120],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...samples]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Academic Structure');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
