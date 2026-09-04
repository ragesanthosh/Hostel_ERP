import XLSX from 'xlsx';

const normalizeKey = (key) => key?.toString().trim().toLowerCase().replace(/[_\s]+/g, ' ');

const getValue = (row, aliases) => {
  for (const alias of aliases) {
    const val = row[alias];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  return '';
};

const parseSheet = (input) => {
  const workbook = typeof input === 'string' ? XLSX.readFile(input) : XLSX.read(input, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!rawRows.length) throw new Error('File is empty or has no data rows');

  return rawRows.map((row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeKey(key)] = value;
    }
    return normalized;
  });
};

const HOSTEL_ALIASES = {
  name: ['hostel name', 'name'],
  code: ['hostel code', 'code'],
  capacity: ['total capacity', 'capacity'],
  floors: ['number of floors', 'floors', 'floor count'],
  gender: ['gender'],
  status: ['status'],
};

const ROOM_ALIASES = {
  roomNumber: ['room number', 'room no', 'room'],
  hostelName: ['hostel name'],
  hostelCode: ['hostel code', 'code'],
  floorNumber: ['floor number', 'floor'],
  capacity: ['room capacity', 'capacity', 'number of beds', 'beds'],
  status: ['room status', 'status'],
};

export const parseHostelRows = (buffer) => {
  const rows = parseSheet(buffer);
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    name: getValue(row, HOSTEL_ALIASES.name),
    code: getValue(row, HOSTEL_ALIASES.code).toUpperCase(),
    capacity: getValue(row, HOSTEL_ALIASES.capacity),
    floors: getValue(row, HOSTEL_ALIASES.floors),
    gender: getValue(row, HOSTEL_ALIASES.gender) || 'Mixed',
    status: getValue(row, HOSTEL_ALIASES.status) || 'Active',
  })).filter((r) => r.name || r.code);
};

export const parseRoomRows = (buffer) => {
  const rows = parseSheet(buffer);
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    roomNumber: getValue(row, ROOM_ALIASES.roomNumber),
    hostelName: getValue(row, ROOM_ALIASES.hostelName),
    hostelCode: getValue(row, ROOM_ALIASES.hostelCode).toUpperCase(),
    floorNumber: getValue(row, ROOM_ALIASES.floorNumber),
    capacity: getValue(row, ROOM_ALIASES.capacity),
    status: getValue(row, ROOM_ALIASES.status) || 'Active',
  })).filter((r) => r.roomNumber || r.hostelName || r.hostelCode);
};

export const generateHostelTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Hostel Name', 'Hostel Code', 'Total Capacity', 'Number of Floors', 'Gender', 'Status'],
    ['Hostel 1', 'HST001', 800, 5, 'Boys', 'Active'],
    ['Hostel 2', 'HST002', 600, 4, 'Girls', 'Active'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hostels');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

export const generateRoomTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Room Number', 'Hostel Code', 'Hostel Name', 'Floor Number', 'Room Capacity', 'Room Status'],
    ['101', 'HST001', 'Hostel 1', 1, 3, 'Active'],
    ['102', 'HST001', 'Hostel 1', 1, 4, 'Active'],
    ['201', 'HST002', 'Hostel 2', 2, 3, 'Under Maintenance'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rooms');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};
