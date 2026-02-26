import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const AI_SERVICE_URL = 'http://127.0.0.1:8000/analyze';

export const analyzeImage = async (imagePath) => {
  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));

  try {
    const response = await axios.post(AI_SERVICE_URL, form, {
      headers: { ...form.getHeaders() },
    });
    return response.data.detections;
  } catch (error) {
    console.error("AI Service Error:", error);
    return [];
  }
};