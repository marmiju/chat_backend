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

// file handaling
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// configuration
configDotenv();
const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5000'],
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
const ioMiddleware = (req, res, next) => {
    req.io = io;
    next();
};

app.use('/api/user', userRouter)
app.use('/api/groups', GroupRouter)
app.use('/api/chats', ioMiddleware, ChatRouter)


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
