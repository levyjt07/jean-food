const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6I4bjKB1mQ_6x1KuHxcemo1WEFeGcW1dGaJucB5iYT05Q";
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/api/analyze', async (req, res) => {
    try {
        const { image, mimeType } = req.body;

        if (!image || !mimeType) {
            return res.status(400).json({ error: 'Image data or MIME type is missing!' });
        }

        // KUNCI UTAMA: Memaksa model mengeluarkan JSON murni melalui generationConfig
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Analyze the contents of the refrigerator in this photo. Based on the available ingredients, provide 3 to 5 feasible recipe recommendations and group them by their respective cuisine type (e.g., "Indonesian Recipe", "Chinese Recipe", "Italian Recipe", "American Recipe", "Mexican Recipe", etc., depending on ingredient compatibility).

You MUST return a JSON Array with the exact structure shown below:
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

        console.log("✅ Data received from Gemini. Parsing structure...");
        
        // Memastikan data yang dikirim ke frontend sudah berupa Array Objek yang valid
        const parsedRecipes = JSON.parse(text.trim());
        
        // Kirim response sukses bersama data yang sudah matang
        res.json({ success: true, recipes: parsedRecipes });

    } catch (error) {
        console.error("❌ Backend Error:", error);
        res.status(500).json({ success: false, error: 'Failed to process image or parse AI JSON layout.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SmartFridge AI Server running at http://localhost:${PORT}`);
});
