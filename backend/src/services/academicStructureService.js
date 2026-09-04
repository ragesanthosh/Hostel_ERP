import AcademicStructure from '../models/AcademicStructure.js';
import Mapping from '../models/Mapping.js';
import { AppError } from '../utils/asyncHandler.js';
import { YEARS } from '../utils/constants.js';

const validateRecord = ({ year, branch, studentStrength }) => {
  if (!year) return 'Academic year is required';
  if (!YEARS.includes(year)) return `Invalid academic year "${year}". Use: ${YEARS.join(', ')}`;
  if (!branch) return 'Branch name is required';
  if (!Number.isFinite(studentStrength) || studentStrength < 1) {
    return 'Student strength must be a positive number';
  }
  return null;
};

export const getRecords = async ({ year, search, page = 1, limit = 20 }) => {
  const query = {};
  if (year) query.year = year;
  if (search) {
    const regex = new RegExp(search, 'i');
    query.branch = regex;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    AcademicStructure.find(query).sort({ year: 1, branch: 1 }).skip(skip).limit(Number(limit)),
    AcademicStructure.countDocuments(query),
  ]);

  return { records, total, page: Number(page), limit: Number(limit) };
};

export const getYears = async () => {
  return AcademicStructure.distinct('year').then((years) =>
    years.sort((a, b) => YEARS.indexOf(a) - YEARS.indexOf(b))
  );
};

export const getBranchesByYear = async (year) => {
  if (!year) throw new AppError('Academic year is required', 400);
  return AcademicStructure.find({ year }).sort({ branch: 1 });
};

export const getStatus = async () => {
  const count = await AcademicStructure.countDocuments();
  return { configured: count > 0, count };
};

export const createRecord = async (data) => {
  const error = validateRecord(data);
  if (error) throw new AppError(error, 400);

  const existing = await AcademicStructure.findOne({ year: data.year, branch: data.branch.toUpperCase() });
  if (existing) throw new AppError(`Record already exists for ${data.year} - ${data.branch}`, 400);

  return AcademicStructure.create({
    year: data.year,
    branch: data.branch.toUpperCase(),
    studentStrength: data.studentStrength,
  });
};

export const updateRecord = async (id, data) => {
  const record = await AcademicStructure.findById(id);
  if (!record) throw new AppError('Record not found', 404);

  const year = data.year ?? record.year;
  const branch = (data.branch ?? record.branch).toUpperCase();
  const studentStrength = data.studentStrength ?? record.studentStrength;

  const error = validateRecord({ year, branch, studentStrength });
  if (error) throw new AppError(error, 400);

  if (year !== record.year || branch !== record.branch) {
    const duplicate = await AcademicStructure.findOne({ year, branch, _id: { $ne: id } });
    if (duplicate) throw new AppError(`Record already exists for ${year} - ${branch}`, 400);

    const mapped = await Mapping.findOne({ year: record.year, branch: record.branch });
    if (mapped) {
      throw new AppError(
        'Cannot change year/branch — a hostel mapping exists. Delete the mapping first.',
        400
      );
    }
  }

  record.year = year;
  record.branch = branch;
  record.studentStrength = studentStrength;
  await record.save();
  return record;
};

export const deleteRecord = async (id) => {
  const record = await AcademicStructure.findById(id);
  if (!record) throw new AppError('Record not found', 404);

  const mapped = await Mapping.findOne({ year: record.year, branch: record.branch });
  if (mapped) {
    throw new AppError(
      `Cannot delete — ${record.year} ${record.branch} is mapped to a hostel. Remove the mapping first.`,
      400
    );
  }

  await record.deleteOne();
  return { message: 'Record deleted' };
};

export const importRecords = async (rows) => {
  const report = { totalProcessed: rows.length, successCount: 0, failedCount: 0, successful: [], failed: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const error = validateRecord({
      year: row.year,
      branch: row.branch,
      studentStrength: row.studentStrength,
    });

    if (error) {
      report.failedCount++;
      report.failed.push({ row: rowNum, reason: error });
      continue;
    }

    try {
      const doc = await AcademicStructure.findOneAndUpdate(
        { year: row.year, branch: row.branch.toUpperCase() },
        { year: row.year, branch: row.branch.toUpperCase(), studentStrength: row.studentStrength },
        { upsert: true, new: true, runValidators: true }
      );
      report.successCount++;
      report.successful.push({ row: rowNum, branch: doc.branch, year: doc.year });
    } catch (err) {
      report.failedCount++;
      report.failed.push({ row: rowNum, reason: err.message });
    }
  }

  return report;
};

export const getStrengthForBranch = async (year, branch) => {
  const record = await AcademicStructure.findOne({ year, branch: branch.toUpperCase() });
  return record?.studentStrength ?? 0;
};
