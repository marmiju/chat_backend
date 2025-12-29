import express from 'express';
import cors from 'cors';
import http from 'http';
import { configDotenv } from 'dotenv';
import { connectDb } from './config/db.js';
import { SocketIO } from './socket.js';
import { Server } from 'socket.io';
import userRouter from './router/User.Routes.js';
import { GroupRouter } from './router/GroupRoutes.js';
import { ChatRouter } from './router/ChatRoutes.js';
import { errorHandler } from './middlewares/error.middleware.js';

// configuration
configDotenv();
const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://chat-backend-0o2r.onrender.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(express.json());


// Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://chat-backend-0o2r.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Connect DB
connectDb();
// Socket
SocketIO(io);
//? Routers
const ioMiddleware = (req, res, next) => {
  try {
    req.io = io;
    next();
  } catch (err) {
    console.log(err)
  }
};

app.use('/api/user', userRouter)
app.use('/api/groups', GroupRouter)
app.use('/api/chats', ioMiddleware, ChatRouter)

app.get('/', (req, res) => {
  res.send('API is running....');
});
app.use(errorHandler)


// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
