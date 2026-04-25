/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuotationItem {
  id: string;
  slNo: number;
  description: string;
  sampleCode: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface BankDetails {
  bankName: string;
  holderName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
}

export interface QuotationData {
  companyName: string;
  gstin: string;
  quotationNo: string;
  date: string;
  enquiredBy: string;
  handledBy: string;
  projectLocation: string;
  contactNo: string;
  billTo: {
    clientName: string;
    address: string;
  };
  items: QuotationItem[];
  discountPercent: number;
  logisticsRate: number;
  taxPercent: number;
  advanceAmount: number;
  signatureName: string;
  validUntil: string;
  bankDetails: BankDetails;
}

export const DEFAULT_QUOTATION: QuotationData = {
  companyName: "WE KEY INTERIO INDIA PRIVATE LIMITED",
  gstin: "37AADCW1524D1ZN",
  quotationNo: "2026-2027\\010",
  date: "24- April-2026",
  enquiredBy: "Ar.Gini Ranka",
  handledBy: "G.ARAVIND CHOWDARY",
  projectLocation: "Bengaluru",
  contactNo: "7661095506",
  billTo: {
    clientName: "Ar.Gini Ranka",
    address: "Purva Fountain Square\nFlat No E1204",
  },
  items: [
    {
      id: "1",
      slNo: 1,
      description: "Interior Walls :Stucco 0098",
      sampleCode: "",
      quantity: 375,
      rate: 170,
      amount: 63750,
    },
  ],
  discountPercent: 10,
  logisticsRate: 15,
  taxPercent: 18,
  advanceAmount: 0,
  signatureName: "Aravind Chowdary",
  validUntil: "May 15 2026",
  bankDetails: {
    bankName: "State Bank of India",
    holderName: "WE KEY INTERIO INDIA PRIVATE LIMITED",
    accountNumber: "42264122415",
    ifsc: "SBIN0002723",
    branch: "JNTUA , Anantapur",
  },
};
