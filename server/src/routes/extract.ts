import { Router } from 'express';
import { z } from 'zod';
import { extractPdfForProject } from '../services/extract.js';

export const extractRouter = Router();

const extractRequestSchema = z.object({
  project_id: z.string().uuid(),
});

extractRouter.post('/', async (req, res) => {
  const parseResult = extractRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid request', details: parseResult.error });
  }

  const { project_id } = parseResult.data;

  // Respond immediately — extraction runs async
  res.json({ status: 'extracting', project_id });

  extractPdfForProject(project_id).catch((error) => {
    console.error(`Extraction failed for project ${project_id}:`, error);
  });
});
