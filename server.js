import express from 'express';
import cors from 'cors';
import http from 'http';
import { configDotenv } from 'dotenv';
import { connectDb } from './Database/db.js';
import { SocketIO } from './socket.js';
import { Server } from 'socket.io';
import { userRouter } from './router/UserRoutes.js';
import { GroupRouter } from './router/GroupRoutes.js';
import { ChatRouter } from './router/ChatRoutes.js';






// configuration
configDotenv();
const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://chat-frontend-xyz.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});


// Middlewares
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://chat-frontend-xyz.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
// Connect DB
connectDb();
// Socket
SocketIO(io);
//? Routers
const ioMiddleware = (req, res, next) => {
    req.io = io;
    next();
};

app.use('/api/user', userRouter)
app.use('/api/groups', GroupRouter)
app.use('/api/chats', ioMiddleware, ChatRouter)

app.get('/', (req, res) => {
    res.send('API is running....');
});


// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
