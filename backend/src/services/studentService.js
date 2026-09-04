import Group from '../models/Group.js';
import Invitation from '../models/Invitation.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Hostel from '../models/Hostel.js';
import Document from '../models/Document.js';
import { deleteAssets } from './cloudinaryService.js';
import { AppError } from '../utils/asyncHandler.js';
import { createNotification } from '../utils/notifications.js';
import { INVITATION_EXPIRY_HOURS, DOCUMENT_TYPES } from '../utils/constants.js';

export const getStudentDashboard = async (studentId) => {
  const student = await User.findById(studentId)
    .populate('hostelId', 'name capacity occupiedSeats')
    .populate('roomId', 'roomNumber capacity')
    .populate({
      path: 'groupId',
      populate: [{ path: 'members', select: 'name regNo rollNo email branch year' }, { path: 'leaderId', select: 'name regNo rollNo email' }, { path: 'roomId', select: 'roomNumber capacity' }],
    });

  if (!student) throw new AppError('Student not found', 404);

  const pendingInvitations = await Invitation.find({
    toUser: studentId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  })
    .populate('fromUser', 'name regNo rollNo email')
    .populate({
      path: 'groupId',
      populate: { path: 'leaderId', select: 'name regNo' },
    });

  return { student, pendingInvitations };
};

export const createGroup = async (leaderId, size) => {
  if (size < 1 || size > 3) throw new AppError('Group size must be between 1 and 3', 400);

  const leader = await User.findById(leaderId);
  if (!leader) throw new AppError('Student not found', 404);
  if (!leader.hostelId) throw new AppError('No hostel assigned to your branch/year', 400);
  if (leader.groupId) throw new AppError('You already belong to a group', 400);
  if (leader.isRoomAllocated) throw new AppError('Room already allocated, cannot create group', 400);

  const existingGroup = await Group.findOne({
    $or: [{ leaderId }, { members: leaderId }],
    status: { $nin: ['invalid'] },
  });
  if (existingGroup) throw new AppError('You already belong to a group', 400);

  const group = await Group.create({
    leaderId,
    members: [leaderId],
    size,
    status: size === 1 ? 'active' : 'forming',
    hostelId: leader.hostelId,
  });

  leader.groupId = group._id;
  await leader.save();

  return group;
};

export const inviteRoommates = async (leaderId, roommates) => {
  const group = await Group.findOne({ leaderId, status: { $in: ['forming', 'pending_invites'] } });
  if (!group) throw new AppError('No active group found', 404);

  const expectedInvites = group.size - 1;
  if (roommates.length !== expectedInvites) {
    throw new AppError(`Please invite exactly ${expectedInvites} roommate(s)`, 400);
  }

  const invitations = [];
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

  for (const roommate of roommates) {
    const student = await User.findOne({
      regNo: roommate.regNo,
      rollNo: roommate.rollNo,
      email: roommate.email,
      role: 'student',
    });

    if (!student) throw new AppError(`Student not found: ${roommate.regNo}`, 404);
    if (student._id.toString() === leaderId.toString()) {
      throw new AppError('Cannot invite yourself', 400);
    }
    if (student.hostelId?.toString() !== group.hostelId.toString()) {
      throw new AppError(`${student.name} is not in your assigned hostel`, 400);
    }
    if (student.groupId) throw new AppError(`${student.name} already belongs to a group`, 400);
    if (student.isRoomAllocated) throw new AppError(`${student.name} already has room allocated`, 400);

    const existingInvite = await Invitation.findOne({
      groupId: group._id,
      toUser: student._id,
      status: 'pending',
    });
    if (existingInvite) throw new AppError(`Invitation already sent to ${student.name}`, 400);

    const invitation = await Invitation.create({
      groupId: group._id,
      fromUser: leaderId,
      toUser: student._id,
      expiresAt,
    });

    await createNotification({
      userId: student._id,
      type: 'invitation_received',
      title: 'Roommate Invitation',
      message: `You have been invited to join a roommate group`,
      relatedId: invitation._id,
    });

    invitations.push(invitation);
  }

  group.status = 'pending_invites';
  await group.save();

  return invitations;
};

export const respondToInvitation = async (invitationId, studentId, action) => {
  const invitation = await Invitation.findById(invitationId).populate('groupId');
  if (!invitation) throw new AppError('Invitation not found', 404);
  if (invitation.toUser.toString() !== studentId.toString()) {
    throw new AppError('Not authorized to respond to this invitation', 403);
  }
  if (invitation.status !== 'pending') throw new AppError('Invitation already responded', 400);
  if (invitation.expiresAt < new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    throw new AppError('Invitation has expired', 400);
  }

  const group = await Group.findById(invitation.groupId);
  const leader = await User.findById(group.leaderId);

  if (action === 'reject') {
    invitation.status = 'rejected';
    await invitation.save();

    group.status = 'invalid';
    await group.save();

    await User.updateMany({ groupId: group._id }, { $unset: { groupId: 1 } });

    await createNotification({
      userId: group.leaderId,
      type: 'group_invalid',
      title: 'Group Invalid',
      message: 'A roommate rejected your invitation. Please create a new group.',
      relatedId: group._id,
    });

    return { message: 'Invitation rejected', groupInvalid: true };
  }

  invitation.status = 'accepted';
  await invitation.save();

  group.members.push(studentId);
  const student = await User.findById(studentId);
  student.groupId = group._id;
  await student.save();

  await createNotification({
    userId: group.leaderId,
    type: 'invitation_accepted',
    title: 'Invitation Accepted',
    message: `${student.name} accepted your roommate invitation`,
    relatedId: invitation._id,
  });

  const allInvitations = await Invitation.find({ groupId: group._id });
  const allAccepted = allInvitations.every((inv) => inv.status === 'accepted');

  if (allAccepted && group.members.length === group.size) {
    group.status = 'active';
    await group.save();

    for (const memberId of group.members) {
      await createNotification({
        userId: memberId,
        type: 'group_active',
        title: 'Group Active',
        message: 'All roommates accepted! You can now select a room.',
        relatedId: group._id,
      });
    }
  }

  return { message: 'Invitation accepted', groupActive: group.status === 'active' };
};

export const getAvailableRooms = async (studentId) => {
  const student = await User.findById(studentId).populate('groupId');
  if (!student?.groupId) throw new AppError('No group found', 404);

  const group = await Group.findById(student.groupId);
  if (group.status !== 'active') throw new AppError('Group must be active to select rooms', 400);
  if (group.leaderId.toString() !== studentId.toString()) {
    throw new AppError('Only group leader can view available rooms', 403);
  }

  const rooms = await Room.find({
    hostelId: group.hostelId,
    status: 'Active',
    isLocked: false,
    $expr: { $gte: [{ $subtract: ['$capacity', { $size: '$students' }] }, group.size] },
  }).sort('roomNumber');

  return rooms.map((room) => ({
    ...room.toJSON(),
    vacantSeats: room.capacity - room.students.length,
  }));
};

export const selectRoom = async (studentId, roomId) => {
  const student = await User.findById(studentId).populate('groupId');
  if (!student?.groupId) throw new AppError('No group found', 404);

  const group = await Group.findById(student.groupId).populate('members');
  if (group.leaderId.toString() !== studentId.toString()) {
    throw new AppError('Only group leader can select a room', 403);
  }
  if (group.status !== 'active') throw new AppError('Group must be active to select a room', 400);
  if (group.roomId) throw new AppError('Room already selected for this group', 400);

  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found', 404);
  if (room.status !== 'Active') throw new AppError('Room is not available for allocation', 400);
  if (room.isLocked) throw new AppError('Room is already locked', 400);
  if (room.hostelId.toString() !== group.hostelId.toString()) {
    throw new AppError('Room is not in your assigned hostel', 403);
  }

  const vacantSeats = room.capacity - room.students.length;
  if (vacantSeats < group.size) {
    throw new AppError('Room does not have enough vacant seats', 400);
  }

  room.isLocked = true;
  room.lockedByGroup = group._id;
  await room.save();

  group.roomId = room._id;
  group.status = 'allocated';
  await group.save();

  return { group, room, message: 'Room locked successfully. Please upload documents.' };
};

export const uploadDocuments = async (leaderId, groupId, documents) => {
  const group = await Group.findById(groupId).populate('members');
  if (!group) throw new AppError('Group not found', 404);
  if (group.leaderId.toString() !== leaderId.toString()) {
    throw new AppError('Only group leader can upload documents', 403);
  }
  if (group.status !== 'allocated') throw new AppError('Room must be selected before uploading documents', 400);
  if (group.documentsSubmitted) {
    throw new AppError('Documents already submitted for this group', 400);
  }

  const savedDocs = [];
  for (const doc of documents) {
    const { userId, type, fileUrl, publicId } = doc;
    if (!DOCUMENT_TYPES.includes(type)) throw new AppError(`Invalid document type: ${type}`, 400);

    const member = group.members.find((m) => m._id.toString() === userId.toString());
    if (!member) throw new AppError('User is not a group member', 400);

    const existing = await Document.findOne({ userId, groupId, type });

    const saved = await Document.findOneAndUpdate(
      { userId, groupId, type },
      { fileUrl, publicId },
      { upsert: true, new: true }
    );

    if (existing?.publicId && existing.publicId !== publicId) {
      await deleteAssets([existing.publicId]);
    }

    savedDocs.push(saved);
  }

  const allMembersHaveAllDocs = await validateAllDocuments(group);
  if (allMembersHaveAllDocs) {
    group.documentsSubmitted = true;
    await group.save();

    const room = await Room.findById(group.roomId);
    for (const member of group.members) {
      const user = await User.findById(member._id || member);
      user.roomId = group.roomId;
      user.isRoomAllocated = true;
      await user.save();

      if (!room.students.includes(user._id)) {
        room.students.push(user._id);
      }

      await createNotification({
        userId: user._id,
        type: 'room_allocated',
        title: 'Room Allocated',
        message: `Your room ${room.roomNumber} has been allocated successfully`,
        relatedId: room._id,
      });
    }

    room.isLocked = false;
    await room.save();

    const hostel = await Hostel.findById(group.hostelId);
    hostel.occupiedSeats += group.members.length;
    await hostel.save();
  }

  return { documents: savedDocs, allComplete: allMembersHaveAllDocs };
};

const validateAllDocuments = async (group) => {
  for (const member of group.members) {
    const memberId = member._id || member;
    const docs = await Document.find({ userId: memberId, groupId: group._id });
    if (docs.length < DOCUMENT_TYPES.length) return false;
  }
  return true;
};

export const getGroupDetails = async (studentId) => {
  const student = await User.findById(studentId);
  if (!student?.groupId) return null;

  return Group.findById(student.groupId)
    .populate('leaderId', 'name regNo rollNo email')
    .populate('members', 'name regNo rollNo email branch year')
    .populate('roomId', 'roomNumber capacity')
    .populate('hostelId', 'name');
};

export const getGroupDocuments = async (groupId, leaderId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);
  if (group.leaderId.toString() !== leaderId.toString()) {
    throw new AppError('Only group leader can view upload status', 403);
  }

  const docs = await Document.find({ groupId }).populate('userId', 'name regNo');
  return docs;
};

export const resetGroup = async (studentId) => {
  const group = await Group.findOne({
    leaderId: studentId,
    status: { $in: ['invalid', 'forming'] },
  });
  if (!group) {
    throw new AppError('No group available to reset', 400);
  }

  await Invitation.deleteMany({ groupId: group._id });

  const docs = await Document.find({ groupId: group._id });
  await deleteAssets(docs.map((doc) => doc.publicId));
  await Document.deleteMany({ groupId: group._id });
  await User.updateMany({ groupId: group._id }, { $unset: { groupId: 1 } });
  await group.deleteOne();

  return { message: 'Group reset successfully' };
};
