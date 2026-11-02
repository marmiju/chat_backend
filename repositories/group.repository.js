import { Group } from '../model/GroupModel.js';

const withPopulatedGroup = (query) =>
  query
    .populate('admin', 'username email')
    .populate('members', 'username email');

export const findGroupById = (groupId) =>
  Group.findById(groupId);

export const findPopulatedGroupById = (groupId) =>
  withPopulatedGroup(Group.findById(groupId));

export const findGroupsByMember = (userId) =>
  withPopulatedGroup(Group.find({ members: userId }));

export const findGroupIdsByMember = (userId) =>
  Group.find({ members: userId }).select('_id');

export const createGroupRepo = async (name, description = '', userId) => {
  const group = await Group.create({
    name,
    description,
    admin: userId,
    isDirect: false,
    members: [userId],
  });
  return findPopulatedGroupById(group._id);
};

export const findDirectGroupBetweenUsersRepo = (userAId, userBId) =>
  withPopulatedGroup(
    Group.findOne({
      isDirect: true,
      members: { $all: [userAId, userBId], $size: 2 },
    })
  );

export const createDirectGroupRepo = async ({
  userAId,
  userBId,
  name,
  description = 'Direct Message',
}) => {
  const group = await Group.create({
    name,
    description,
    admin: userAId,
    isDirect: true,
    members: [userAId, userBId],
  });
  return findPopulatedGroupById(group._id);
};

// Backward-compatible export alias
export const CreateGroupRepo = createGroupRepo;

export const addMemberToGroupRepo = async (groupId, userId) => {
  await Group.updateOne(
    { _id: groupId },
    { $addToSet: { members: userId } }
  );
  return findPopulatedGroupById(groupId);
};

export const removeMemberFromGroupRepo = async (groupId, userId) => {
  await Group.updateOne(
    { _id: groupId },
    { $pull: { members: userId } }
  );
  return findPopulatedGroupById(groupId);
};

export const deleteGroupByIdRepo = (groupId) =>
  Group.findByIdAndDelete(groupId);
