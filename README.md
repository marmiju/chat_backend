# 🗂️ Chat Backend - Full Documentation

A complete backend system for real-time chat applications using **Express.js** and **Socket.IO**, with structured route handling for users, groups, and chat messages.

---

## 🧰 Tech Stack

- **Node.js**
- **Express.js**
- **Socket.IO**
- **Dotenv** (for environment variables)

---

## 📁 Folder Structure

```
backend_1/
├── .env
├── .gitignore
├── package.json
├── server.js
├── socket.js
├── router/
│   ├── UserRoutes.js
│   ├── GroupRoutes.js
│   └── ChatRoutes.js
└── controller/
    ├── UserController.js
    ├── GroupController.js
    └── ChatController.js
```

---

## 🚦 How Routing Works

The backend uses Express routers, which are modular and separated by feature:

### ✅ 1. `UserRoutes.js`
Handles user-related routes such as:
```http
POST   /api/user/register     # Register a new user
POST   /api/user/login        # User login
GET    /api/user/profile      # Get user profile
```

### ✅ 2. `GroupRoutes.js`
Handles group-related operations:
```http
POST   /api/group/create      # Create new group
GET    /api/group/:id         # Get group by ID
POST   /api/group/add-user    # Add user to group
```

### ✅ 3. `ChatRoutes.js`
Handles chat messaging:
```http
POST   /api/chat/send         # Send message
GET    /api/chat/:group_id    # Fetch all messages from a group
```

---

## 🔌 Socket.IO Events

- `join room` → Join a group chat room.
- `send message` → Send message to group.
- `receive message` → Receive messages from other users.

---

## ⚙️ Installation

```bash
git clone https://github.com/your-username/chat_backend.git
cd chat_backend
npm install
touch .env  # Create your environment file
npm start
```

---

## 🌐 Example `.env` File

```
PORT=5000
```

---

## 📤 Sample API Request

```http
POST /api/user/register
Content-Type: application/json

{
  "username": "azizar",
  "email": "azizar@example.com",
  "password": "123456"
}
```

---

## 📡 Sample Socket.IO Client Event

```js
socket.emit('join room', 'group123');
socket.emit('send message', {
  group_id: 'group123',
  text: 'Hello World',
  sender: 'user123'
});
```

---

## 🛠️ Future Improvements

- 🧑‍💼 User Authentication with JWT
- 🧠 Add Message Caching with Redis
- 🗄️ Store messages in a real database (e.g., MongoDB/MySQL)

---

## 🧑‍💻 Developed By

Azizar Rahman — [GitHub](https://github.com/marmiju)

---

## 🪪 License

[MIT License](LICENSE)
