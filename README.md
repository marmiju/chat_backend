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
    git clone https://github.com/marmiju/chat_backend.git
    cd chat_backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the root directory and add the following environment variables:

    ```env
    MONGO_USER=your_mongodb_username
    MONGO_PASS=database_pass
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

The real-time functionality is handled by Socket.IO events. The following tables outline the events that are listened for on the server (client-emitted) and the events that are emitted from the server to the client.

### Client-Emitted Events

| Event             | Payload                               | Description                               |
| :---------------- | :------------------------------------ | :---------------------------------------- |
| `join_group`      | `{ "groupId": "group_id" }`           | Joins a user to a group.                  |
| `leave_group`     | `{ "groupId": "group_id" }`           | Removes a user from a group.              |
| `admin_add_member`| `{ "groupId": "group_id", "userIdToAdd": "user_id" }` | Adds a new member to a group (admin only). |
| `admin_remove_member`| `{ "groupId": "group_id", "userIdToRemove": "user_id" }` | Removes a member from a group (admin only). |
| `typing`          | `{ "groupId": "group_id", "isTyping": true }` | Broadcasts when a user is typing.         |
| `message_read`    | `{ "messageId": "message_id" }`       | Marks a message as read.                  |
| `send_message`    | `{ "groupId": "group_id", "content": "..." }` | Sends a message to a group.             |

### Server-Emitted Events

| Event             | Payload                               | Description                               |
| :---------------- | :------------------------------------ | :---------------------------------------- |
| `initialonline`   | `{ "groupId": "group_id", "users": [...] }` | Provides the initial list of online users in a group. |
| `online_member`   | `{ "groupId": "group_id", "username": "...", "userId": "..." }` | Notifies when a user comes online.        |
| `user_offline`    | `{ "userId": "user_id" }`             | Notifies when a user goes offline.        |
| `member_joined`   | `{ "userId": "...", "username": "..." }` | Notifies when a new member joins a group. |
| `member_left`     | `{ "userId": "...", "username": "..." }` | Notifies when a member leaves a group.    |
| `member_added`    | `{ "userId": "...", "by": "..." }`    | Notifies when a member is added to a group by an admin. |
| `member_removed`  | `{ "userId": "...", "by": "..." }`    | Notifies when a member is removed from a group by an admin. |
| `removed_from_group` | `{ "groupId": "...", "by": "..." }` | Notifies a user that they have been removed from a group. |
| `new_message`     | `{...messageObject}`                  | Sends a new message to the group.         |
| `message_delivered` | `{ "messageId": "...", "to": "...", "at": "..." }` | Confirms that a message has been delivered. |
| `message_read`      | `{ "messageId": "...", "userId": "...", "at": "..." }` | Confirms that a message has been read by a user. |
| `typing`          | `{ "groupId": "...", "username": "...", "isTyping": true }` | Broadcasts that a user is typing to other members of a group. |

## 💡 Future Improvements

- [ ] **Message Caching:** Implement Redis for caching messages to reduce database load.
- [ ] **File Sharing:** Allow users to share images and other files.
- [ ] **Push Notifications:** Add push notifications for new messages.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

A complete backend system for real-time chat applications using **Express.js** and **Socket.IO**, with structured route handling for users, groups, and chat messages.