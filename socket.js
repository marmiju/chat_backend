import jwt from 'jsonwebtoken'
import { Group } from './model/GroupModel.js';
import { Message } from './model/ChatModel.js';

const socketToUser = new Map()
const onlineUsers = new Map()

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

        // Get all groups where this user is member
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
            socket.emit("initialonline", {
                groupId: g._id.toString(),
                users: onlineList
            });

            socket.to(g._id.toString()).emit("online_member", {
                groupId: g._id.toString(),
                username: user.username,
                userId: userId
            });
        }

        // join in group
        socket.on('join_group', async ({ groupId }, ack) => {
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
                //  Notify others
                socket.to(groupId).emit('member_joined', {
                    userId,
                    username: user.username
                });
                //  Ack success
                ack?.({
                    status: 'ok',
                    message: 'Joined group successfully'
                });
            } catch (err) {
                console.error('join_group error:', err);
                ack?.({
                    status: 'error',
                    message: 'Internal server error'
                });
            }
        });


        // leave from group

        socket.on('leave_group', async ({ groupId }, ack) => {
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

                //  Notify others
                socket.to(groupId).emit('member_left', {
                    userId,
                    username: user.username
                });

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
                // get payload from front-end
                const { groupId, content } = data;

                const group = await Group.findById(groupId).populate('members', '_id username email')
                if (!group)
                    return ack?.({ status: 'error', message: 'Group not found' });

                const deliveries = group.members.map(m => ({
                    user: m._id,
                    status: m._id.toString() === user._id.toString() ? 'read' : 'sent',
                    at: new Date()
                }));

                const message = await Message.create({
                    sender: user._id,
                    content,
                    group: groupId,
                    deliveries
                });

                const populated = await Message.findById(message._id)
                    .populate('sender', 'username email').populate('deliveries.user', 'username');

                io.to(groupId).emit('new_message', populated);

                // delivery controll
                for (const member of group.members) {
                    const memberId = member._id.toString();
                    if (memberId === user._id.toString()) continue;

                    const sockets = onlineUsers.get(memberId);
                    if (sockets && sockets.size > 0) {
                        await Message.updateOne(
                            { _id: message._id, 'deliveries.user': member._id },
                            { $set: { 'deliveries.$.status': 'delivered', 'deliveries.$.at': new Date() } }
                        );

                        for (const sId of sockets) {
                            io.to(sId).emit('message_delivered', {
                                messageId: message._id.toString(),
                                to: memberId,
                                at: new Date()
                            });
                        }
                    }
                }
                ack?.({ status: 'ok', messageId: message._id });
            } catch (err) {
                ack?.({ status: 'error', message: err.message });
            }
        });

        // read messages
        socket.on('message_read', async ({ messageId }, ack) => {
            try {
                const message = await Message.findById(messageId);
                if (!message)
                    return ack?.({ status: 'error', message: 'Message not found' });

                await Message.updateOne(
                    { _id: messageId, 'deliveries.user': user._id },
                    { $set: { 'deliveries.$.status': 'read', 'deliveries.$.at': new Date() } }
                );

                io.to(message.group.toString()).emit('message_read', {
                    messageId,
                    userId: user._id.toString(),
                    at: new Date()
                });

                ack?.({ status: 'ok' });
            } catch (err) {
                ack?.({ status: 'error', message: err.message });
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

        // admin add group member
        socket.on('admin_add_member', async ({ groupId, userIdToAdd }, ack) => {
            try {
                const group = await Group.findById(groupId);
                if (!group) return ack?.({ status: 'error', message: 'Group not found' });

                if (group.admin.toString() !== user._id.toString()) {
                    return ack?.({ status: 'error', message: 'Not group admin' });
                }
                if (group.members.map(m => m.toString()).includes(userIdToAdd)) {
                    return ack?.({ status: 'error', message: 'Already a member' });
                }
                group.members.push(userIdToAdd);
                await group.save();

                // notify group room
                io.to(groupId).emit('member_added', { userId: userIdToAdd, by: user._id.toString() });
                ack?.({ status: 'ok' });
            } catch (err) {
                ack?.({ status: 'error', message: err.message });
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