import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { analyzeImage } from './aiService.js';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

router.post('/process-frame', upload.single('frame'), async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const imagePath = req.file.path;

    // 1. Call the Python AI Service
    const detections = await analyzeImage(imagePath);

    // 2. If AI detects a violation, save it to Supabase
    if (detections && detections.length > 0) {
      await prisma.incidentLog.create({
        data: {
          examSessionId: sessionId,
          type: detections[0].item,
          confidence: detections[0].confidence,
          imageUrl: "local_temp_path",
        },
      });
    }

    res.json({ success: true, detections });
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: "Processing failed" });
  }
});

export default router;