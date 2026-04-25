import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

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

    const result = JSON.parse(response.text || "{}");
    return res.status(200).json(result);
  } catch (error) {
    console.error("AI extraction error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
