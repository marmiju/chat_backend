import express from 'express';
import cors from 'cors';
import http from 'http';
import { configDotenv } from 'dotenv';
import { connectDb } from './Database/db.js';
import { SocketIO } from './socket.js';
import { Server } from 'socket.io';
import { userRouter } from './router/UserRoutes.js';
import { GroupRouter } from './router/GroupRouter.js';

// configuration
configDotenv();
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middlewares
app.use(cors());
app.use(express.json());
// Connect DB
connectDb();
// Socket
SocketIO(io);
//? Routers
app.use('/api/user', userRouter)
app.use('/api/groups', GroupRouter)

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
