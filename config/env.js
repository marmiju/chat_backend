import { configDotenv } from "dotenv";
configDotenv();



// mongo connection
export const MONGO_USER = process.env.MONGO_USER 
export const MONGO_PASS = process.env.MONGO_PASS 


export const MONGO_URL = process.env.MONGO_URI || `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@cluster0.smwmg.mongodb.net/chatApp`;

// export const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/chatApp_test';

export const JWT_SECRET = process.env.JWT_SECRET || '1234';
