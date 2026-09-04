import mongoose from 'mongoose';

const mappingSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      required: true,
    },
    branch: { type: String, required: true, trim: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    studentStrength: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mappingSchema.index({ year: 1, branch: 1 }, { unique: true });

const Mapping = mongoose.model('Mapping', mappingSchema);
export default Mapping;
