import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Hostel from '../models/Hostel.js';
import Room from '../models/Room.js';
import Mapping from '../models/Mapping.js';
import AcademicStructure from '../models/AcademicStructure.js';
import { BRANCH_STRENGTH } from '../utils/constants.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Hostel.deleteMany({}),
      Room.deleteMany({}),
      Mapping.deleteMany({}),
      AcademicStructure.deleteMany({}),
    ]);

    console.log('Cleared existing data...');

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      password: 'admin123',
      pin: '1234',
      role: 'admin',
      isFirstLogin: false,
    });

    const hostels = [];
    for (const h of [
      { name: 'Hostel 1', code: 'HST001', capacity: 800, floors: 5, gender: 'Boys', status: 'Active', occupiedSeats: 0 },
      { name: 'Hostel 2', code: 'HST002', capacity: 600, floors: 4, gender: 'Girls', status: 'Active', occupiedSeats: 0 },
      { name: 'Hostel 3', code: 'HST003', capacity: 500, floors: 4, gender: 'Mixed', status: 'Active', occupiedSeats: 0 },
    ]) {
      hostels.push(await Hostel.create(h));
    }

    for (const hostel of hostels) {
      const rooms = [];
      for (let floor = 1; floor <= 5; floor++) {
        for (let num = 1; num <= 20; num++) {
          const roomNumber = `${floor}${String(num).padStart(2, '0')}`;
          rooms.push({
            hostelId: hostel._id,
            roomNumber,
            floorNumber: floor,
            capacity: num % 4 === 0 ? 4 : 3,
            status: 'Active',
            students: [],
          });
        }
      }
      await Room.insertMany(rooms);
    }

    const wardenData = [
      {
        name: 'Warden Kumar',
        employeeId: 'WRD001',
        email: 'warden1@college.edu',
        mobile: '9876543210',
        password: 'warden123',
        pin: '5678',
        role: 'warden',
        hostelId: hostels[0]._id,
      },
      {
        name: 'Warden Sharma',
        employeeId: 'WRD002',
        email: 'warden2@college.edu',
        mobile: '9876543211',
        password: 'warden123',
        pin: '9012',
        role: 'warden',
        hostelId: hostels[1]._id,
      },
      {
        name: 'Warden Patel',
        employeeId: 'WRD003',
        email: 'warden3@college.edu',
        mobile: '9876543212',
        password: 'warden123',
        pin: '3456',
        role: 'warden',
        hostelId: hostels[2]._id,
      },
    ];

    const wardens = [];
    for (const data of wardenData) {
      wardens.push(await User.create({ ...data, isFirstLogin: false }));
    }

    for (let i = 0; i < hostels.length; i++) {
      hostels[i].wardenId = wardens[i]._id;
      await hostels[i].save();
    }

    const academicData = [
      { year: '1st Year', branch: 'CSE', studentStrength: 280 },
      { year: '1st Year', branch: 'ECE', studentStrength: 220 },
      { year: '1st Year', branch: 'EEE', studentStrength: BRANCH_STRENGTH.EEE },
      { year: '1st Year', branch: 'IT', studentStrength: BRANCH_STRENGTH.IT },
      { year: '2nd Year', branch: 'CSE', studentStrength: 265 },
      { year: '2nd Year', branch: 'ECE', studentStrength: BRANCH_STRENGTH.ECE },
      { year: '2nd Year', branch: 'MECH', studentStrength: 180 },
      { year: '2nd Year', branch: 'CIVIL', studentStrength: 120 },
      { year: '3rd Year', branch: 'CSE', studentStrength: BRANCH_STRENGTH.CSE },
      { year: '3rd Year', branch: 'AI&DS', studentStrength: BRANCH_STRENGTH['AI&DS'] },
    ];
    await AcademicStructure.insertMany(academicData);

    await Mapping.insertMany([
      { year: '2nd Year', branch: 'CSE', hostelId: hostels[0]._id, studentStrength: 265 },
      { year: '2nd Year', branch: 'ECE', hostelId: hostels[0]._id, studentStrength: BRANCH_STRENGTH.ECE },
      { year: '2nd Year', branch: 'MECH', hostelId: hostels[0]._id, studentStrength: 180 },
      { year: '2nd Year', branch: 'CIVIL', hostelId: hostels[0]._id, studentStrength: 120 },
      { year: '1st Year', branch: 'EEE', hostelId: hostels[1]._id, studentStrength: BRANCH_STRENGTH.EEE },
      { year: '1st Year', branch: 'IT', hostelId: hostels[1]._id, studentStrength: BRANCH_STRENGTH.IT },
      { year: '3rd Year', branch: 'AI&DS', hostelId: hostels[2]._id, studentStrength: BRANCH_STRENGTH['AI&DS'] },
      { year: '3rd Year', branch: 'CSE', hostelId: hostels[2]._id, studentStrength: BRANCH_STRENGTH.CSE },
    ]);

    const students = [];
    const studentData = [
      { name: 'Rahul Verma', regNo: 'REG2024001', rollNo: '22CSE001', branch: 'CSE', year: '2nd Year', email: 'rahul@college.edu', gender: 'Male' },
      { name: 'Priya Singh', regNo: 'REG2024002', rollNo: '22CSE002', branch: 'CSE', year: '2nd Year', email: 'priya@college.edu', gender: 'Female' },
      { name: 'Amit Kumar', regNo: 'REG2024003', rollNo: '22CSE003', branch: 'CSE', year: '2nd Year', email: 'amit@college.edu', gender: 'Male' },
      { name: 'Sneha Reddy', regNo: 'REG2024004', rollNo: '22ECE001', branch: 'ECE', year: '2nd Year', email: 'sneha@college.edu', gender: 'Female' },
      { name: 'Vikram Joshi', regNo: 'REG2024005', rollNo: '22ECE002', branch: 'ECE', year: '2nd Year', email: 'vikram@college.edu', gender: 'Male' },
      { name: 'Ananya Gupta', regNo: 'REG2024006', rollNo: '22MECH001', branch: 'MECH', year: '2nd Year', email: 'ananya@college.edu', gender: 'Female' },
      { name: 'Karan Mehta', regNo: 'REG2024007', rollNo: '22CIVIL001', branch: 'CIVIL', year: '2nd Year', email: 'karan@college.edu', gender: 'Male' },
      { name: 'Divya Nair', regNo: 'REG2024008', rollNo: '24EEE001', branch: 'EEE', year: '1st Year', email: 'divya@college.edu', gender: 'Female' },
      { name: 'Rohan Das', regNo: 'REG2024009', rollNo: '24IT001', branch: 'IT', year: '1st Year', email: 'rohan@college.edu', gender: 'Male' },
      { name: 'Meera Iyer', regNo: 'REG2024010', rollNo: '22AIDS001', branch: 'AI&DS', year: '3rd Year', email: 'meera@college.edu', gender: 'Female' },
    ];

    for (const s of studentData) {
      const mapping = await Mapping.findOne({ year: s.year, branch: s.branch });
      students.push(
        await User.create({
          ...s,
          password: 'student123',
          role: 'student',
          hostelId: mapping?.hostelId,
          isFirstLogin: false,
        })
      );
    }

    console.log('\n========== SEED DATA CREATED ==========\n');
    console.log('ADMIN LOGIN:');
    console.log('  Name: System Admin');
    console.log('  Email: admin@college.edu');
    console.log('  PIN: 1234');
    console.log('  Password: admin123\n');

    console.log('WARDEN LOGINS:');
    wardens.forEach((w, i) => {
      console.log(`  ${hostels[i].name}: ${w.email} / warden123`);
    });

    console.log('\nSTUDENT LOGINS (password: student123):');
    students.forEach((s) => {
      console.log(`  ${s.name}: ${s.regNo} / ${s.rollNo} / ${s.email}`);
    });

    console.log('\n=======================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
