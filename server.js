import express from 'express';
import cors from 'cors';
import http from 'http';
import { configDotenv } from 'dotenv';
import { Server } from 'socket.io';
import { connectDb } from './config/db.js';
import { SocketIO } from './socket.js';
import userRouter from './router/User.Routes.js';
import { GroupRouter } from './router/group.routes.js';
import { ChatRouter } from './router/ChatRoutes.js';
import healthroute from './router/health.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

configDotenv();

const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://chat-backend-0o2r.onrender.com',
];

const createCorsConfig = (methods) => ({
  origin: ALLOWED_ORIGINS,
  methods,
  credentials: true,
});

const withSocketIO = (ioInstance) => (req, _res, next) => {
  req.io = ioInstance;
  next();
};

const app = express();
export const server = http.createServer(app);
const io = new Server(server, {
  cors: createCorsConfig(['GET', 'POST']),
});

app.use(express.json());
app.use(cors(createCorsConfig(['GET', 'POST', 'PUT', 'DELETE'])));

// Initialize database and real-time socket server
connectDb();
SocketIO(io);

// Routes
const attachIO = withSocketIO(io);
app.use('/health', healthroute);
app.use('/api/user', userRouter);
app.use('/api/groups', attachIO, GroupRouter);
app.use('/api/chats', attachIO, ChatRouter);

app.get('/', (_req, res) => {
  res.send('API is running....');
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
