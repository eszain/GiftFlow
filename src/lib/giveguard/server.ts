import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import express from 'express';
import cors from 'cors';
import { CONFIG } from './lib/config';
import charityRoutes from './routes/charity';
import fundraiserRoutes from './routes/fundraiser';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', charityRoutes);
app.use('/api', fundraiserRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(CONFIG.PORT, () => {
  console.log(`GiveGuard (in-memory) API running on :${CONFIG.PORT}`);
  console.log(`GEMINI_API_KEY loaded: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
});