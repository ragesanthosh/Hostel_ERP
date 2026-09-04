import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    type: {
      type: String,
      enum: ['fee_receipt', 'college_id', 'aadhaar', 'passport_photo'],
      required: true,
    },
    fileUrl: { type: String, required: true },
    publicId: { type: String },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, groupId: 1, type: 1 }, { unique: true });

const Document = mongoose.model('Document', documentSchema);
export default Document;
