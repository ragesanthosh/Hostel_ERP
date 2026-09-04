import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['admin', 'student', 'warden'],
      required: true,
    },
    pin: { type: String },
    regNo: { type: String, sparse: true, unique: true },
    rollNo: { type: String, sparse: true, unique: true },
    employeeId: { type: String, sparse: true, unique: true },
    mobile: { type: String, trim: true },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    },
    branch: {
      type: String,
      enum: ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT', 'AI&DS'],
    },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    isRoomAllocated: { type: Boolean, default: false },
    documentsVerified: { type: Boolean, default: false },
    isFirstLogin: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.pin;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
