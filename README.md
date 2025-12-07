# Chat Backend

A powerful and scalable backend for real-time chat applications, built with Node.js, Express, and Socket.IO. This project provides a solid foundation for creating feature-rich chat services with support for users, groups, and real-time messaging.

## ✨ Features

- **Real-Time Communication:** Instant messaging with Socket.IO.
- **User Authentication:** Secure user registration and login.
- **Group Chats:** Create and manage chat groups.
- **RESTful API:** A well-structured API for users, groups, and messages.
- **Scalable Architecture:** Modular design for easy expansion.

## 🛠️ Tech Stack

- **[Node.js](https://nodejs.org/)**: JavaScript runtime environment.
- **[Express.js](https://expressjs.com/)**: Web framework for Node.js.
- **[Socket.IO](https://socket.io/)**: Library for real-time web applications.
- **[MongoDB](https://www.mongodb.com/)**: NoSQL database for data storage.
- **[JSON Web Tokens (JWT)](https://jwt.io/)**: For secure user authentication.
- **[Dotenv](https://www.npmjs.com/package/dotenv)**: For managing environment variables.

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v14 or later)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/chat_backend.git
    cd chat_backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the root directory and add the following environment variables:

    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    ```

4.  **Start the server:**
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:5000`.

## 📁 Project Structure

```
chat_backend/
├── .gitignore
├── package.json
├── server.js
├── socket.js
├── Database/
│   └── db.js
├── middlewares/
│   └── AuthMidlewares.js
├── model/
│   ├── ChatModel.js
│   ├── GroupModel.js
│   └── UserModel.js
├── public/
│   ├── chat.js
│   ├── index.html
│   ├── login.html
│   └── login.js
└── router/
    ├── ChatRoutes.js
    ├── GroupRoutes.js
    └── UserRoutes.js
```

## 🔌 API Endpoints

The API is structured into three main resources: Users, Groups, and Chats.

### User Routes

| Method | Endpoint             | Description              |
| :----- | :------------------- | :----------------------- |
| `POST` | `/api/user/register` | Register a new user      |
| `POST` | `/api/user/login`    | Log in an existing user  |
| `GET`  | `/api/user/profile`  | Get the user's profile   |

### Group Routes

| Method | Endpoint             | Description              |
| :----- | :------------------- | :----------------------- |
| `POST` | `/api/group/create`  | Create a new group       |
| `GET`  | `/api/group/:id`     | Get group details by ID  |
| `POST` | `/api/group/add-user`| Add a user to a group    |

### Chat Routes

| Method | Endpoint              | Description                      |
| :----- | :-------------------- | :------------------------------- |
| `POST` | `/api/chat/send`      | Send a message to a group        |
| `GET`  | `/api/chat/:group_id` | Fetch all messages from a group  |

## ⚡ Socket.IO Events

The real-time functionality is handled by Socket.IO events.

| Event             | Payload                               | Description                               |
| :---------------- | :------------------------------------ | :---------------------------------------- |
| `join room`       | `{ "room": "group_id" }`              | Joins a user to a specific group's room.  |
| `send message`    | `{ "room": "group_id", "text": "..." }` | Sends a message to a group.               |
| `receive message` | `{ "sender": "...", "text": "..." }`   | Received when another user sends a message. |

## 💡 Future Improvements

- [ ] **Message Caching:** Implement Redis for caching messages to reduce database load.
- [ ] **Typing Indicators:** Show when a user is typing a message.
- [ ] **File Sharing:** Allow users to share images and other files.
- [ ] **Push Notifications:** Add push notifications for new messages.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developed By

Azizar Rahman — [GitHub](https.github.com/marmiju)