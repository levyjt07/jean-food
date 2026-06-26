const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6JMG1NE5u5kFsWLwAqVM7IbPAw5igVEeWH4FSdAhZKjyg";
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/analyze', async (req, res) => {
    try {
        const { image, mimeType } = req.body;

        if (!image || !mimeType) {
            return res.status(400).json({ error: 'Image data or MIME type is missing!' });
        }

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Analyze the contents of the refrigerator in this photo. Based on the available ingredients, provide 3 to 5 feasible recipe recommendations and group them by their respective cuisine type (e.g., "Indonesian Recipe", "Chinese Recipe", "Italian Recipe", "American Recipe", "Mexican Recipe", etc.).

You MUST return a valid JSON Array where each object contains "cuisine", "name", "ingredients" (as an array of strings), and "steps" (as an array of strings). Follow this exact structural schema:
[
  {
    "cuisine": "Italian Recipe",
    "name": "Classic Creamy Carbonara",
    "ingredients": ["Pasta", "Eggs", "Garlic", "Cheese", "Black Pepper"],
    "steps": ["Boil the pasta in salted water until al dente.", "Whisk the eggs and cheese together in a bowl.", "Pan-fry the garlic, combine everything off the heat, and toss until creamy."]
  }
]`;

        const imagePart = {
            inlineData: { data: image, mimeType: mimeType },
        };

        console.log("🤖 Requesting recipe recommendations from Gemini API...");
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log("📥 Raw response received from Gemini. Sanitizing data...");
        
        // 🛡️ PERTAHANAN UTAMA: Bersihkan teks dari segala jenis bungkusan markdown jika AI bandel
        let cleanText = text.trim();
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "");
        } else if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```/, "").replace(/```$/, "");
        }

        // Parse teks yang sudah bersih menjadi JSON Object aman
        const parsedRecipes = JSON.parse(cleanText.trim());
        
        console.log("✅ Data successfully parsed! Sending to frontend.");
        res.json({ success: true, recipes: parsedRecipes });

    } catch (error) {
        console.error("❌ Backend Error:", error);
        res.status(500).json({ success: false, error: 'Failed to process image or parse AI JSON layout.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SmartFridge AI Server running at http://localhost:${PORT}`);
});
