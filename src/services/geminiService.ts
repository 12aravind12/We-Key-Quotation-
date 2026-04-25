/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QuotationData } from "../types";

export async function extractQuotationData(text: string): Promise<Partial<QuotationData>> {
  if (!text.trim()) return {};

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('AI extraction failed');
    }

    const result = await response.json();
    
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
