import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const extractionSchema = {
  type: Type.OBJECT,
  properties: {
    clientName: { type: Type.STRING },
    clientAddress: { type: Type.STRING },
    quotationNo: { type: Type.STRING },
    date: { type: Type.STRING },
    enquiredBy: { type: Type.STRING },
    handledBy: { type: Type.STRING },
    projectLocation: { type: Type.STRING },
    contactNo: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          sampleCode: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          rate: { type: Type.NUMBER },
        },
        required: ["description", "quantity", "rate"],
      },
    },
    discountPercent: { type: Type.NUMBER },
    logisticsRate: { type: Type.NUMBER },
    taxPercent: { type: Type.NUMBER },
    validUntil: { type: Type.STRING },
    advanceAmount: { type: Type.NUMBER },
  },
};

app.post("/api/extract", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required" });

  const prompt = `
    Extract structured quotation data from the following text paste. 
    The text might be messy snippets from a chat or document.
    
    TEXT:
    ${text}
    
    Rules:
    - If items are found, extract description, quantity, and rate.
    - If taxes, discounts, or logistics costs are mentioned as percentages or rates per sqft, extract them.
    - If client names or addresses are found, extract them.
    - If dates or valid-until periods are found, extract them.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema as any,
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("AI extraction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
