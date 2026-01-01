
import { configDotenv } from "dotenv";

configDotenv();
export const MONGO_USER = process.env.MONGO_USER
export const MONGO_PASS = process.env.MONGO_PASS
export const JWT_SECRET = process.env.JWT_SECRET