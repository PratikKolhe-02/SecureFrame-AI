import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import examRoute from "./src/examRoute.js"; 

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routing
app.use("/api/exam", examRoute);

app.get("/", (req, res) => {
    res.status(200).json({
        status: "online",
        service: "SecureFrame-AI Backend",
        timestamp: new Date().toISOString(),
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`[SecureFrame-AI] Server running on port ${PORT}`);
});

export default app;