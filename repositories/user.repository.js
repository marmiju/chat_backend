import { User } from '../model/user.model.js';

export const escapeRegex = (str = '') =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const findById = (id) =>
  User.findById(id).select('-password -pushSubscriptions');

export const findByIdWithPassword = (id) =>
  User.findById(id);

export const findUsersWithPushSubscriptions = (userIds) =>
  User.find({
    _id: { $in: userIds },
    'pushSubscriptions.0': { $exists: true },
  }).select('_id username pushSubscriptions');

export const addPushSubscriptionRepo = async (userId, subscription) => {
  await User.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
  );
  return User.updateOne(
    { _id: userId },
    {
      $push: {
        pushSubscriptions: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
          createdAt: new Date(),
        },
      },
    }
  );
};

export const removePushSubscriptionRepo = (userId, endpoint) =>
  User.updateOne(
    { _id: userId },
    { $pull: { pushSubscriptions: { endpoint } } }
  );

export const findByEmail = (email) =>
  User.findOne({ email: String(email || '').trim().toLowerCase() });

export const findOneByUsername = (username) => {
  const safePattern = `^${escapeRegex(String(username || '').trim())}$`;
  return User.findOne({ username: { $regex: safePattern, $options: 'i' } });
};

export const findByUsername = (username, limit = 20) => {
  const safePattern = escapeRegex(username.trim());
  return User.find({ username: { $regex: safePattern, $options: 'i' } })
    .select('_id username email displayName avatar bio title statusText phone')
    .limit(limit);
};

export const createUser = (data) => User.create(data);

export const updateUserById = (id, updates) =>
  User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');
