import mongoose from "mongoose";
import { configDotenv } from "dotenv";

configDotenv();

const username = encodeURIComponent(process.env.MONGO_USER);
const pass = encodeURIComponent(process.env.MONGO_PASS);
const dbname = "chatApp";

const mongoString = `mongodb+srv://${username}:${pass}@cluster0.xrep4vt.mongodb.net/${dbname}?retryWrites=true&w=majority&appName=Cluster0`;

export const connectDb = () => {
  mongoose.connect(mongoString)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection failed", err));
};
