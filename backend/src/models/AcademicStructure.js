import mongoose from 'mongoose';

const academicStructureSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      required: true,
    },
    branch: { type: String, required: true, trim: true, uppercase: true },
    studentStrength: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

academicStructureSchema.index({ year: 1, branch: 1 }, { unique: true });

const AcademicStructure = mongoose.model('AcademicStructure', academicStructureSchema);
export default AcademicStructure;
