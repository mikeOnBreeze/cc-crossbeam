import express from 'express';
import { generateRouter } from './routes/generate.js';
import { extractRouter } from './routes/extract.js';

const app = express();

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/generate', generateRouter);
app.use('/extract', extractRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`CrossBeam server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
