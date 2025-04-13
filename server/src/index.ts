import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/generate-music', async (req, res) => {
    try {
        const { context, musicalIdea } = req.body;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a music composition assistant. Generate musical sequences based on provided context and ideas."
                },
                {
                    role: "user",
                    content: `Musical Context:\n${context}\n\nGenerate a musical sequence for:\n${JSON.stringify(musicalIdea, null, 2)}`
                }
            ],
            temperature: 0.7,
        });

        // Process the completion into musical notes and metadata
        const response = {
            notes: [], // Process the completion into musical notes
            key: musicalIdea.key || "C",
            timeSignature: musicalIdea.timeSignature || "4/4"
        };

        res.json(response);
    } catch (error) {
        console.error('Error generating music:', error);
        res.status(500).json({ error: 'Failed to generate music' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});