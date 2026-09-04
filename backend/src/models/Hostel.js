import mongoose from 'mongoose';

const hostelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    capacity: { type: Number, required: true, min: 0, default: 0 },
    occupiedSeats: { type: Number, default: 0, min: 0 },
    floors: { type: Number, min: 1 },
    gender: { type: String, enum: ['Boys', 'Girls', 'Mixed'], default: 'Mixed' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    wardenId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

hostelSchema.virtual('remainingSeats').get(function () {
  return Math.max(0, this.capacity - this.occupiedSeats);
});

hostelSchema.virtual('vacantSeats').get(function () {
  return Math.max(0, this.capacity - this.occupiedSeats);
});

hostelSchema.set('toJSON', { virtuals: true });
hostelSchema.set('toObject', { virtuals: true });

const Hostel = mongoose.model('Hostel', hostelSchema);
export default Hostel;
