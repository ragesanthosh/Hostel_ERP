import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    roomNumber: { type: String, required: true, trim: true },
    floorNumber: { type: Number, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Under Maintenance'],
      default: 'Active',
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isLocked: { type: Boolean, default: false },
    lockedByGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  },
  { timestamps: true }
);

roomSchema.index({ hostelId: 1, roomNumber: 1 }, { unique: true });

roomSchema.virtual('occupiedSeats').get(function () {
  return (this.students || []).length;
});

roomSchema.virtual('vacantSeats').get(function () {
  return Math.max(0, this.capacity - (this.students || []).length);
});

roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

const Room = mongoose.model('Room', roomSchema);
export default Room;
