
import { Group } from './model/GroupModel.js';
import { Message } from './model/ChatModel.js';


const socketToUser = new Map()
const onlineUsers = new Map()

// active group
const activeGroupBySocket = new Map();

export const SocketIO = io => {
    // configure socket
    io.use((socket, next) => {
        const userStr = socket.handshake.auth?.user;
        if (!userStr) return next(new Error("No user provided"));
        try {
            const user = JSON.parse(userStr);
            socket.data.user = user;
            next();
        } catch (e) {
            next(new Error("Invalid user JSON"));
        }
    });
    // user connections 
    io.on("connection", async (socket) => {
        const user = socket.data.user;
        if (!user) return socket.disconnect(true);
        const userId = user._id.toString();
        // Track user sockets
        socketToUser.set(socket.id, userId);

        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);
        console.log("User connected:", user.username);

        const groups = await Group.find({ members: userId }).populate('members', '_id username');
        for (const g of groups) {
            let onlineList = [];
            socket.join(g._id.toString());
            // Get online users of this group
            for (const member of g.members) {
                const mId = member._id.toString();
                if (onlineUsers.has(mId) && onlineUsers.get(mId).size > 0) {
                    onlineList.push({
                        username: member.username,
                        userId: mId
                    });
                }
            }
            // delivery status
            await Message.updateMany(
                {
                    group: g._id,
                    "sender": { $ne: userId },
                    "deliveries.status": { $eq: 'sent' }
                },
                {
                    $set: {
                        deliveries: {
                            user: userId,
                            status: "delivered",
                            at: new Date()
                        }
                    }
                }
            );
            const updatedMessages = await Message.find({
                group: g._id,
                "deliveries.user": userId
            })
                .populate('sender', 'username email')
                .populate('deliveries.user', 'username')
                .sort({ createdAt: -1 })
                .limit(50);

            io.to(g._id.toString()).emit('updateMessage', updatedMessages);

            socket.emit("initialonline", {
                groupId: g._id.toString(),
                users: onlineList
            });

            io.to(g._id.toString()).emit("online_member", {
                groupId: g._id.toString(),
                username: user.username,
                userId: userId
            });
        }

        socket.on('create_group', async (data, ack) => {
            try {
                const { groupId } = data;
                socket.join(groupId);
                ack?.({
                    status: 'ok',
                    message: 'Group created!'
                });
                await Message.create({
                    sender: user._id,
                    content: `${user.username} created the group.`,
                    type: 'notification',
                    group: groupId,

                });
            }
            catch (err) {
                console.error('create_group error:', err);
                ack?.({
                    status: 'error',
                    message: 'Internal server error'
                });
            }
        });

        // add-user-to-group
        socket.on('add-user-to-group', async ({ groupId, userId, username }, ack) => {
            try {
                if (!groupId || !userId) {
                    return ack?.({
                        status: 'error',
                        message: 'Invalid data',
                    });
                }
                const group = await Group.findById(groupId);
                if (!group) {
                    return ack?.({
                        status: 'error',
                        message: 'Group not found',
                    });
                }
                // chech ismember or not
                const isMember = group.members.some(
                    m => m.toString() === userId
                );


                if (isMember) {
                    return ack?.({ status: 'error', message: 'Already a member' });
                }
                //  Update DB (automic push)
                await Group.updateOne(
                    { _id: groupId },
                    { $push: { members: userId } }
                );
                //  Join socket room
                socket.join(groupId);

                ack?.({
                    status: 'success',
                    message: 'User added to group successfully',
                });
                // optional: notify group members
                io.to(groupId).emit('group_member_added', {
                    groupId,
                    userId,
                });
                const newmessage = await Message.create({
                    content: `${user.username} added ${username}`,
                    type: 'notification',
                    group: groupId,
                    sender: user._id,
                })
                io.to(groupId).emit('new_message', newmessage);


            } catch (err) {
                console.error('add-user-to-group error:', err);
                ack?.({
                    status: 'error',
                    message: 'Internal server error',
                });
            }
        });
        // leave from group
        socket.on('leave', async ({ groupId }, ack) => {
            try {
                const userId = user._id.toString();

                //  Validate group
                const group = await Group.findById(groupId);
                if (!group) {
                    return ack?.({ status: 'error', message: 'Group not found' });
                }
                //  Check membership
                const isMember = group.members.some(
                    m => m.toString() === userId
                );

                if (!isMember) {
                    return ack?.({ status: 'error', message: 'You are not a member of this group' });
                }

                //  Remove from DB (atomic)
                await Group.updateOne(
                    { _id: groupId },
                    { $pull: { members: userId } }
                );

                //  Leave socket room
                socket.leave(groupId);
                const newmessage = await Message.create({
                    content: `${user.username} left from the group`,
                    type: 'notification',
                    group: groupId,
                    sender: user._id,
                })
                socket.to(groupId).emit('new_message', newmessage);
                //  Ack success
                ack?.({
                    status: 'ok',
                    message: 'Left group successfully'
                });

            } catch (err) {
                console.error('leave_group error:', err);
                ack?.({
                    status: 'error',
                    message: 'Internal server error'
                });
            }
        });

        socket.on('send_message', async (data, ack) => {
            console.log('send_message event received:', data);
            try {
                const { groupId, content } = data;
                const group = await Group.findById(groupId).populate('members', '_id username email')
                if (!group)
                    return ack?.({ status: 'error', message: 'Group not found' });

                const deliveries = group.members.map(m => ({
                    user: m._id,
                    status: 'sent',
                    at: new Date()
                }));

                const message = await Message.create({
                    sender: user._id,
                    content,
                    type: 'message',
                    group: groupId,
                    deliveries
                });

                // delivery controll
                for (const member of group.members) {
                    const memberId = member._id.toString();
                    if (memberId === user._id.toString()) continue;

                    const sockets = onlineUsers.get(memberId);
                    if (!sockets) continue;

                    for (const sId of sockets) {
                        const activeGroup = activeGroupBySocket.get(sId);

                        if (activeGroup === groupId.toString()) {
                            //  chat open
                            await Message.updateOne(
                                { _id: message._id, 'deliveries.user': member._id },
                                {
                                    $set: {
                                        'deliveries.$.status': 'read',
                                        'deliveries.$.at': new Date()
                                    }
                                }
                            );
                        } else {
                            // online but not viewing → DELIVERED
                            await Message.updateOne(
                                { _id: message._id, 'deliveries.user': member._id },
                                {
                                    $set: {
                                        'deliveries.$.status': 'delivered',
                                        'deliveries.$.at': new Date()
                                    }
                                }
                            );
                        }
                    }
                }


                const populated = await Message.findById(message._id)
                    .populate('sender', 'username email').populate('deliveries.user', 'username');
                io.to(groupId).emit('new_message', populated);
                ack?.({ status: 'ok', messageId: message._id });

            } catch (err) {
                ack?.({ status: 'error', message: err.message });
            }
        });

        // marks as read
        // --- Place this inside io.on("connection", async (socket) => { ... }) ---

        socket.on('mark_as_read', async ({ groupId, unreadIds }) => {
            try {
                const userId = socket.data.user._id.toString();

                // 1. Update DB: Find messages where this user is a recipient and change status to 'read'
                await Message.updateMany(
                    {
                        _id: { $in: unreadIds },
                        'deliveries.user': userId
                    },
                    {
                        $set: {
                            'deliveries.$.status': 'read',
                            'deliveries.$.at': new Date()
                        }
                    }
                );

                const updatedMessages = await Message.find({
                    group: groupId,
                    "deliveries.user": userId,
                    "deliveries.status": 'read',
                })
                    .populate('sender', 'username email')
                    .populate('deliveries.user', 'username')
                    .sort({ createdAt: -1 })
                    .limit(50);

                io.to(groupId.toString()).emit('updateMessage', updatedMessages);

                // 3. Confirm to the sender of the event that it worked

            } catch (err) {
                console.error('mark_as_read error:', err);
            }
        });

        // typing indecator
        socket.on('typing', ({ groupId, isTyping }) => {
            console.log('typing ', user.username)
            if (isTyping) {
                socket.to(groupId).emit('typing', {
                    groupId: groupId,
                    username: user.username,
                    isTyping
                });
            }
        });


        // admin_remove_member: { groupId, userIdToRemove }
        socket.on('admin_remove_member', async ({ groupId, userIdToRemove }, ack) => {
            try {
                const group = await Group.findById(groupId);
                if (!group) return ack?.({ status: 'error', message: 'Group not found' });

                if (group.admin.toString() !== user._id.toString()) {
                    return ack?.({ status: 'error', message: 'Not group admin' });
                }
                if (!group.members.map(m => m.toString()).includes(userIdToRemove)) {
                    return ack?.({ status: 'error', message: 'User not a member' });
                }
                // remove
                group.members.pull(userIdToRemove);
                await group.save();
                // if removed user is online, disconnect them from group room (force leave)
                const sockets = onlineUsers.get(userIdToRemove);
                if (sockets) {
                    for (const sId of sockets) {
                        const s = io.sockets.sockets.get(sId);
                        if (s) {
                            s.leave(groupId);
                            s.emit('removed_from_group', { groupId, by: user._id.toString() });
                        }
                    }
                }
                io.to(groupId).emit('member_removed', { userId: userIdToRemove, by: user._id.toString() });
                ack?.({ status: 'ok' });
            } catch (err) {
                ack?.({ status: 'error', message: err.message });
            }
        });

        // track user group
        socket.on('active_group', ({ groupId }) => {
            activeGroupBySocket.set(socket.id, groupId);
        });

        socket.on('inactive_group', () => {
            activeGroupBySocket.delete(socket.id);
        });



        // handle disconnect
        socket.on('disconnect', () => {
            const uid = socketToUser.get(socket.id);
            socketToUser.delete(socket.id);
            if (uid) {
                const set = onlineUsers.get(uid);
                if (set) {
                    set.delete(socket.id);
                    if (set.size === 0) {
                        onlineUsers.delete(uid);
                        // broadcast offline to groups
                        (async () => {
                            const groups = await Group.find({ members: uid }).select('_id');
                            for (const g of groups) {
                                io.to(g._id.toString()).emit('user_offline', { userId: uid });
                            }
                        })();
                    } else {
                        onlineUsers.set(uid, set);
                    }
                }
            }
            console.log(`socket disconnected: ${socket.id}`);
            console.log(onlineUsers)
        });
    }) // end of the connection with scket

};