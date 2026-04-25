/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { QuotationData } from "../types";

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

export async function extractQuotationData(text: string): Promise<Partial<QuotationData>> {
  if (!text.trim()) return {};

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
    
    // Transform extracted JSON to match QuotationData structure
    const data: any = {};
    if (result.clientName || result.clientAddress) {
      data.billTo = {
        clientName: result.clientName || "",
        address: result.clientAddress || "",
      };
    }
    
    if (result.items) {
      data.items = result.items.map((item: any, idx: number) => ({
        id: Math.random().toString(36).substr(2, 9),
        slNo: idx + 1,
        description: item.description,
        sampleCode: item.sampleCode || "",
        quantity: item.quantity,
        rate: item.rate,
        amount: item.quantity * item.rate,
      }));
    }

    const fields = [
      "quotationNo", "date", "enquiredBy", "handledBy", 
      "projectLocation", "contactNo", "discountPercent", 
      "logisticsRate", "taxPercent", "validUntil", "advanceAmount"
    ];

    fields.forEach(f => {
      if (result[f] !== undefined) data[f] = result[f];
    });

    return data;
  } catch (error) {
    console.error("AI extraction error:", error);
    return {};
  }
}
