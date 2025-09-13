import dotenv from 'dotenv';
dotenv.config();
export const CONFIG = { PORT: parseInt(process.env.PORT || '3001', 10) };
