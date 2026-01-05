import mongoose from "mongoose";
import { MONGO_URL } from "./env.js";
import { configDotenv } from "dotenv";

configDotenv()

// ===========


  export const connectDb = async () => {
    try {
      await mongoose.connect(MONGO_URL);
      console.log("✅ MongoDB connected");
    } catch (err) {
      console.error("❌ MongoDB connection failed", err.message);
      process.exit(1);
    }
  };

