import mongoose from "mongoose";
import { configDotenv } from "dotenv";

configDotenv();

const username = encodeURIComponent(process.env.MONGO_USER);
const pass = encodeURIComponent(process.env.MONGO_PASS);
const dbname = "chatApp";

const mongoString = process.env.NODE_ENV === 'test' ? process.env.MONGO_URI : `mongodb+srv://${username}:${pass}@cluster0.smwmg.mongodb.net/${dbname}?appName=Cluster0`;

export const connectDb = () => {
  mongoose.connect(mongoString)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection failed", err));
};
