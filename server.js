const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
// Set JSON payload limit to 10mb to accommodate high-res Base64 image strings safely
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6I4bjKB1mQ_6x1KuHxcemo1WEFeGcW1dGaJucB5iYT05Q";
const genAI = new GoogleGenerativeAI(apiKey);

// API Endpoint for fridge image analysis
app.post('/api/analyze', async (req, res) => {
    try {
        const { image, mimeType } = req.body;

        if (!image || !mimeType) {
            return res.status(400).json({ error: 'Image data or MIME type is missing!' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // English prompt enforcing strict JSON formatting across worldwide cuisines
        const prompt = `Analyze the contents of the refrigerator in this photo. Based on the available ingredients, provide 3 to 5 feasible recipe recommendations and group them by their respective cuisine type (e.g., "Indonesian Recipe", "Chinese Recipe", "Italian Recipe", "American Recipe", "Mexican Recipe", etc., depending on ingredient compatibility).

You MUST strictly return the response as a raw JSON Array with the exact structure shown below. Do not include any introductory text, concluding text, or markdown formatting wrappers (such as \`\`\`json ... \`\`\`):

[
  {
    "cuisine": "Italian Recipe",
    "name": "Classic Creamy Carbonara",
    "ingredients": ["Pasta", "Eggs", "Garlic", "Cheese", "Black Pepper"],
    "steps": ["Boil the pasta in salted water until al dente.", "Whisk the eggs and cheese together in a bowl.", "Pan-fry the garlic, combine everything off the heat, and toss until creamy."]
  },
  {
    "cuisine": "Indonesian Recipe",
    "name": "Traditional Fried Rice",
    "ingredients": ["White Rice", "Garlic & Shallots", "Egg", "Chili", "Sweet Soy Sauce"],
    "steps": ["Sauté the minced garlic, shallots, and chilies until fragrant.", "Scramble the egg in the pan.", "Add the rice, pour sweet soy sauce, season with salt, and stir thoroughly until well combined."]
  }
]`;

        const imagePart = {
            inlineData: {
                data: image,
                mimeType: mimeType
            },
        };

        console.log("🤖 Requesting recipe recommendations from Gemini API...");
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log("✅ Data successfully retrieved from Gemini.");
        
        // Return raw JSON text directly to frontend
        res.json({ result: text });

    } catch (error) {
        console.error("❌ Backend Error:", error);
        res.status(500).json({ error: 'Failed to process the image on the backend server.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 SmartFridge AI Server running at http://localhost:${PORT}`);
});