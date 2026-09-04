import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    size: { type: Number, required: true, min: 1, max: 3 },
    status: {
      type: String,
      enum: ['forming', 'pending_invites', 'active', 'invalid', 'allocated'],
      default: 'forming',
    },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
    documentsSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Group = mongoose.model('Group', groupSchema);
export default Group;
