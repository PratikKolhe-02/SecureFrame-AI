const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/logs', async (req, res) => {
  const { violations, timestamp, userId } = req.body;

  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('ExamSession')
      .insert([{
        userId: userId || null,
        startTime: new Date(timestamp).toISOString(),
        endTime: new Date().toISOString(),
        status: 'completed',
        riskScore: (violations || []).length * 10 
      }])
      .select()
      .single();

    if (sessionError) throw sessionError;

    if (violations && violations.length > 0) {
      const logsToInsert = violations.map(log => ({
        sessionId: sessionData.id, 
        description: typeof log === 'string' ? log : (log.msg || 'Violation'),
        evidence_url: log.evidence || null,
        type: 'AI_DETECTION',
        timestamp: new Date().toISOString()
      }));

      const { error: logError } = await supabase
        .from('IncidentLog')
        .insert(logsToInsert);

      if (logError) throw logError;
    }

    res.status(200).json({ message: "Success", sessionId: sessionData.id });
  } catch (error) {
    console.error("❌ Database Sync Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log(`Server running on port 5000`));