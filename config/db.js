import mongoose from "mongoose";
import { MONGO_PASS, MONGO_USER } from "./env.js";


const username = encodeURIComponent(MONGO_USER);
const pass = encodeURIComponent(MONGO_PASS);
const dbname = "chatApp";

const mongoString = `mongodb+srv://${username}:${pass}@cluster0.smwmg.mongodb.net/${dbname}?appName=Cluster0`;
console.log(mongoString)

export const connectDb = () => {
  mongoose.connect(mongoString)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection failed", err));
};
