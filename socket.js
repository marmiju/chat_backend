import jwt from 'jsonwebtoken'
import { User } from './model/UserModel.js'
import { Group } from './model/GroupModel.js';



const socketToUser = new Map()
const onlineUsers = new Map()

export const SocketIO = io => {
    // configure socket
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decode.id).select('-password');
            if (!user) {
                return next(new Error('User not found'));
            }
            socket.data.user = user;
            next(); // Call next on success
        } catch (err) {
            return next(new Error('Authentication error'));
        }
    });
    // user connections 
    io.on('connection', (socket) => {
        const user = socket.data.user
        if (!user) return socket.disconnect(true)
        // track socket - user
        socketToUser.set(socket.id, user._id.toString())
        if (!onlineUsers.has(user._id.toString())) {
            onlineUsers.set(user._id.toString(), new Set())
        }
        onlineUsers.get(user._id.toString()).add(socket.id)
        console.log(`User connected: ${user.username} (${user._id}) socket: ${socket.id}`);

        (async () => {
            const groups = await Group.find({ members: user._id }).select('_id');
            console.log("groups", groups)
            for (const g of groups) {
                socket.to(g._id.toString()).emit('user_online', { userId: user._id.toString() });
            }
        })();

        // join in group
        socket.on('join_group', async ({ groupId }, ack) => {
            try {
                const group = await Group.findById(groupId);
                if (!group) return ack?.({ status: 'error', message: 'Group not found' });

                if (group.members.map(m => m.toString()).includes(user._id.toString())) {
                    return ack?.({ status: 'error', message: 'Not a member of this group' });
                }

                socket.join(groupId)

                socket.to(groupId).emit('member_joined', {
                    userId: user._id.toString(),
                    username: user.username
                })

                // send status
                ack?.({ status: 'ok' });

            } catch (err) {
                ack?.({ status: 'error', message: err.message });
            }
        })

        // leave from group

        socket.on('leave_group', async ({ groupId }, ack) => {
            try {
                const group = await Group.findById(groupId);
                if (!group) return ack?.({ status: 'error', message: 'Group not found' });

                socket.leave(groupId);

                socket.to(groupId).emit('member_left', {
                    userId: user._id.toString(),
                    username: user.username
                });

                ack?.({ status: 'ok' });
            } catch (err) {
                ack?.({ status: 'error', message: err.message });
            }
        });

        socket.on('send_message', async (data, ack) => {
            try {
                // get payload from front-end
                const { groupId, content } = data;
                if (!groupId, !content) return ack?.({ status: 'error', message: 'Invalid payload' });
                // 
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
                    .populate('sender', 'username email');

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
            socket.to(groupId).emit('typing', {
                userId: user._id.toString(),
                username: user.username,
                isTyping
            });
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
        });
    }) // end of the connection with scket

};