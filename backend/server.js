app.post('/api/logs', async (req, res) => {
  const { violations, timestamp } = req.body;

  try {
    // 1. Create the ExamSession record first
    const { data: sessionData, error: sessionError } = await supabase
      .from('ExamSession')
      .insert([{
        startTime: new Date(timestamp).toISOString(),
        endTime: new Date().toISOString(),
        status: 'completed',
        riskScore: violations.length * 10 // Basic logic: more logs = higher risk
      }])
      .select()
      .single();

    if (sessionError) throw sessionError;

    const sessionId = sessionData.id;

    // 2. If there are violations, link them to this sessionId
    if (violations.length > 0) {
      const logsToInsert = violations.map(log => ({
        sessionId: sessionId, // Foreign Key link
        description: log.msg,
        type: 'AI_DETECTION',
        timestamp: new Date().toISOString()
      }));

      const { error: logError } = await supabase
        .from('IncidentLog')
        .insert(logsToInsert);

      if (logError) throw logError;
    }

    res.status(200).json({ message: "Session and Logs archived successfully", sessionId });
    
  } catch (error) {
    console.error("❌ Database Sync Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});