/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { 
  Download, 
  Plus, 
  Trash2, 
  FileText, 
  Zap, 
  Building2, 
  User, 
  Calendar, 
  MapPin, 
  Phone,
  Eraser,
  Menu,
  X,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { QuotationData, DEFAULT_QUOTATION, QuotationItem } from './types';
import { extractQuotationData } from './services/geminiService';
import { cn, formatCurrency, numberToWords } from './lib/utils';

export default function App() {
  const [data, setData] = useState<QuotationData>(DEFAULT_QUOTATION);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [isBankUnlocked, setIsBankUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const pagesRef = useRef<HTMLDivElement>(null);

  const handleVerifyPin = () => {
    if (pinInput === '0110') {
      setIsBankUnlocked(true);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleLockBankFields = () => {
    setIsBankUnlocked(false);
    setPinInput('');
  };

  // Calculations
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const calculatedFields = useMemo(() => {
    const rawTotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
    
    const discountAmount = (data.discountPercent / 100) * rawTotal;
    const logisticsAmount = data.logisticsRate * totalQuantity;
    
    const taxableAmount = rawTotal - discountAmount + logisticsAmount;
    const taxAmount = (data.taxPercent / 100) * taxableAmount;
    const totalWithTax = taxableAmount + taxAmount;
    
    const grandTotalRound = Math.round(totalWithTax);

    // Dynamic Advance Logic
    const advanceAmount = grandTotalRound < 100000 ? grandTotalRound : Math.round(grandTotalRound * 0.75);
    const advancePercentage = grandTotalRound < 100000 ? 100 : 75;
    
    return {
      rawTotal,
      totalQuantity,
      discountAmount,
      logisticsAmount,
      taxableAmount,
      taxAmount,
      totalWithTax,
      grandTotalRound,
      advanceAmount,
      advancePercentage,
      financialTerms: [
        "The estimate based on measurement provided. The final billing will be based on actual area covered.",
        "Once advance is processed, it implicitly states that you agree to terms and conditions mentioned in this document.",
        "Advance once processed will not be refunded under any circumstance.",
        "On completion of the project, the remaining balance of (n/a) should be paid within 3 Days. Strictly No Retention allowed. If Not paid 24% interest will be charged per annum.",
        "We reserve the right to change the prices or withdraw the quotation until you sign this document and process the Payment",
        "The price includes Material and Labor. Surfaces less than 1 feet in width will be considered 1 feet.",
        "Lead Time: We can start the project in 15 days after the advance is received, if the site is ready",
        "The approx. days to complete the project once it started: 3 to 5 days",
        "The terms and conditions in this document supersede other documents like your Purchase Order, Work Order, etc",
        "Rs.10/sft will be added to the base rate at final billing when the surface finish is done on Ceiling in final invoice.",
        "The Price mentioned for the finishes are for light colours & for dark colours we add Rs.10 to 20 / sft Based on the final colour in final invoice",
        "Payment should be processed as a single work order to avail the mentioned discount."
      ],
      executionTerms: [
        "The entire project has to be executed in a single phase. We will not be able to break the project in multiple phases.",
        "Surface Preparation: Provide plumb walls with 2 Coat Water-based primer applied on it.",
        "All Masonry repair should be completed by you and should be cured for at least 28 days to avoid shrinkage cracks. We will not be responsible for such cracks.",
        "Lime Plaster Colour shades vary around 25% from the chosen colour due to manual application, compression and distribution of pigments. It is considered normal and should not be treated as application defect.",
        "Lime Plaster is applied by hand so uniform application like paint is not possible, nor we would try to mimic paint. Variation in texture is natural and should not be treated as application defect.",
        "For work scheduling please treat Lime Plaster as Wall Paper / Finish Paint, meaning that it should be the last thing in the schedule, just before installation of fittings, etc. A dust-free site is required.",
        "Lime Plaster is absorbent so care should be taken to cover it with plastic, during any other work nearby. For example: polishing marble, Painting ceilings etc. Note: Marble Polishing was very detrimental effect on lime plaster, so please complete it before Lime Plaster is started",
        "Our material is very thick; it will is not possible to apply it inside the grooves and small areas. You will have to get it painted after our work is completed. We can do Regular Acrylic Painting (non limocoat) inside the Grooves for a running feet charge. Rate will be same as the Sq.ft. Rate of the limocoat finish selected. Groove color may not match",
        "We would not take any accountability for any marks or damages that are caused to the applied or painted wall by any other reason or individual beyond our scope"
      ],
      logisticsTerms: [
        "Existing electric cables, light fixtures, Air conditioners and other office furniture has to be removed and installed by you if required.",
        "If Lime Plaster is applied on wood or gypsum panels, the risk of joint cracking is very high. You will have to apply reinforcement tapes and fill the joints with high quality adhesives. In any case we do not warrant the cracks. Any re-work arising due to cracks will be charged accordingly.",
        "Any Customized work like stencil, grooving, etc, Will be charged extra according to the complexity of Job.",
        "You will have to provide erected double metal scaffolding where ever required. Scaffolding including installation and removal is not in the scope of WE KEY INTERIO.",
        "You will pay for clearance of Debris from the site.",
        "You will have to provide accommodation at site for Applicators.",
        "You will have to supply electricity and water during execution.",
        "You will have to provide secured area at the site to store our material.",
        "Accommodation and travel of the APPLICATOR shall be taken care by client for outside regional centre or additionally 30 – 50 rs/sqft shall be chargeable",
        "Please note that this product is very difficult to touch-up if there is any damage after our work is completed. Make sure all other work is completed before our work starts.",
        "WE KEY INTERIO shall be allowed to take the pictures of the project for the records.",
        "Final Billing shall be based on the actual quantities applied at site.",
        "Your Order confirmation will be processed under assumption of your agreement for all the above.",
        "If the project is delayed from your side, the new schedule has to be worked out mutually.",
        "LimoCoat (JBR Coatings Pvt.Ltd.) is Just a Supplier of the Products; We as an Applicator are Responsible For Actual Application And the Quality of the Finish."
      ]
    };
  }, [data.items, data.discountPercent, data.logisticsRate, data.taxPercent]);

  const handleUpdateItem = (id: string, updates: Partial<QuotationItem>) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: Math.random().toString(36).substr(2, 9),
      slNo: data.items.length + 1,
      description: '',
      sampleCode: '',
      quantity: 0,
      rate: 0,
      amount: 0
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (id: string) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id).map((item, idx) => ({ ...item, slNo: idx + 1 }))
    }));
  };

  const handleAiExtract = async () => {
    if (!aiInput.trim()) return;
    setIsExtracting(true);
    try {
      const extracted = await extractQuotationData(aiInput);
      setData(prev => ({
        ...prev,
        ...extracted,
        billTo: extracted.billTo || prev.billTo,
        items: (extracted.items as QuotationItem[]) || prev.items
      }));
      setAiInput('');
      setActiveTab('manual');
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  const downloadPdf = async () => {
    if (!pagesRef.current || isDownloading) return;
    
    setIsDownloading(true);
    console.log('Initiating PDF Generation');
    
    try {
      // Ensure we are at the top for capture accuracy
      const originalScrollTop = window.scrollY;
      window.scrollTo(0, 0);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageElements = Array.from(pagesRef.current.children);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < pageElements.length; i++) {
        const el = pageElements[i] as HTMLElement;
        console.log(`Processing page ${i + 1} of ${pageElements.length}`);
        
        // Wait a tiny bit for layout to settle in clone
        const canvas = await html2canvas(el, {
          scale: 1, // Start with 1 to ensure standard reliability
          useCORS: true,
          logging: true, // Enable logging for troubleshooting
          allowTaint: true,
          backgroundColor: '#ffffff',
          imageTimeout: 15000, // Increase timeout
          onclone: (clonedDoc) => {
            const cloneEl = clonedDoc.getElementById(el.id);
            if (cloneEl) {
              cloneEl.style.width = '210mm';
              cloneEl.style.minHeight = '297mm';
            }

            // Remove oklch/color-mix from all elements in clone
            const styleOverride = clonedDoc.createElement('style');
            styleOverride.textContent = `
              * {
                /* Aggressively strip problematic styles */
                color: #000 !important;
                border-color: #ccc !important;
                background-image: none !important;
                box-shadow: none !important;
                text-shadow: none !important;
                transition: none !important;
                animation: none !important;
              }
              
              /* Restore specific colors for items we know are safe */
              .text-stone-500 { color: #666 !important; }
              .text-stone-400 { color: #999 !important; }
              .bg-stone-100 { background-color: #f3f3f3 !important; }
              
              .pdf-page {
                background: #ffffff !important;
                width: 210mm !important;
                min-height: 297mm !important;
                margin: 0 !important;
                padding: 14mm !important;
                display: block !important;
                position: relative !important;
                overflow: hidden !important;
              }

              /* Reset all Tailwind 4 root variables to hex fallbacks */
              :root {
                --color-stone-900: #1c1917 !important;
                --color-stone-800: #292524 !important;
                --color-stone-700: #44403c !important;
                --color-stone-600: #57534e !important;
                --color-stone-500: #78716c !important;
                --color-stone-400: #a8a29e !important;
                --color-stone-300: #d6d3d1 !important;
                --color-stone-200: #e7e5e4 !important;
                --color-stone-100: #f5f5f4 !important;
                --color-stone-50: #fafaf9 !important;
              }
            `;
            clonedDoc.head.appendChild(styleOverride);
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
      
      const fileName = `Quotation_${data.quotationNo.replace(/[\/\\]/g, '_')}.pdf`;
      pdf.save(fileName);
      console.log('PDF saved successfully');
      
      // Restore scroll
      window.scrollTo(0, originalScrollTop);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Failed to generate PDF: ${msg}. Try using a different browser or simplifying the content.`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-stone-200 flex flex-col md:flex-row relative">
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-stone-100 text-black p-4 rounded-full shadow-2xl active:scale-95 transition-transform"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Settings and Controls */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-[320px] sm:w-[380px] bg-[#0a0a0a] border-r border-[#222] flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-full",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-8 border-b border-[#222]">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-stone-100 text-black">
              <FileText size={22} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-white tracking-wide leading-none">Interior Billing</h1>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-[0.2em] mt-1.5">WE KEY INTERIO</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Tabs */}
          <div className="flex border-b border-[#222]">
            <button
              onClick={() => setActiveTab('manual')}
              className={cn(
                "flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2",
                activeTab === 'manual' ? "text-white border-white" : "text-stone-600 border-transparent hover:text-stone-400"
              )}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={cn(
                "flex-1 pb-3 text-xs font-black uppercase tracking-widest transition-all border-b-2",
                activeTab === 'ai' ? "text-white border-white" : "text-stone-600 border-transparent hover:text-stone-400"
              )}
            >
              AI Smart-Paste
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'manual' ? (
              <motion.div
                key="manual"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* General Info */}
                <section className="space-y-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">General Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Quotation No</label>
                      <input 
                        className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors"
                        value={data.quotationNo}
                        onChange={e => setData({...data, quotationNo: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Dated</label>
                      <input 
                        className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors"
                        value={data.date}
                        onChange={e => setData({...data, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Enquired By</label>
                      <input 
                        className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors"
                        value={data.enquiredBy}
                        onChange={e => setData({...data, enquiredBy: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Handled By</label>
                      <input 
                        className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors"
                        value={data.handledBy}
                        onChange={e => setData({...data, handledBy: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Project Location</label>
                    <input 
                      className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors"
                      value={data.projectLocation}
                      onChange={e => setData({...data, projectLocation: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Authorized Signatory</label>
                    <input 
                      className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors"
                      value={data.signatureName}
                      onChange={e => setData({...data, signatureName: e.target.value})}
                    />
                  </div>
                </section>

                {/* Bank & Validity */}
                <section className="space-y-4 pt-8 border-t border-[#222]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Bank & Validity</h2>
                    <button 
                      onClick={isBankUnlocked ? handleLockBankFields : undefined}
                      className={cn(
                        "text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 px-2 py-1 rounded transition-colors",
                        isBankUnlocked ? "text-green-500 bg-green-500/10 hover:bg-green-500/20" : "text-stone-600"
                      )}
                    >
                      {isBankUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                      {isBankUnlocked ? "Unlocked" : "Locked"}
                    </button>
                  </div>

                  {!isBankUnlocked ? (
                    <div className="p-4 bg-stone-900/50 border border-[#222] rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-stone-400">
                        <AlertCircle size={14} />
                        <p className="text-[10px] font-bold uppercase tracking-wider">PIN required to edit bank details</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="password"
                          placeholder="Enter PIN..."
                          className={cn(
                            "w-full sm:flex-1 bg-[#050505] border px-3 py-2 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors",
                            pinError ? "border-red-500 animate-shake" : "border-[#333]"
                          )}
                          value={pinInput}
                          onChange={e => setPinInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleVerifyPin()}
                        />
                        <button 
                          onClick={handleVerifyPin}
                          className="w-full sm:w-auto bg-stone-100 text-black px-4 py-2 rounded text-[10px] font-black uppercase hover:bg-white transition-colors shrink-0"
                        >
                          Unlock
                        </button>
                      </div>
                      {pinError && <p className="text-[9px] text-red-500 font-bold uppercase tracking-tighter">Incorrect Security PIN</p>}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest flex items-center gap-2">
                        Bank Name {!isBankUnlocked && <Lock size={10} />}
                      </label>
                      <input 
                        className={cn(
                          "w-full px-3 py-3 text-sm rounded outline-none transition-colors",
                          isBankUnlocked 
                            ? "bg-[#151515] border border-[#333] text-stone-200 focus:border-stone-500 shadow-[0_0_15px_rgba(255,255,255,0.02)]" 
                            : "bg-[#0a0a0a]/50 border border-[#222] text-stone-500 cursor-not-allowed"
                        )}
                        value={data.bankDetails.bankName}
                        onChange={e => setData({...data, bankDetails: {...data.bankDetails, bankName: e.target.value}})}
                        readOnly={!isBankUnlocked}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest flex items-center gap-2">
                        Holder Name {!isBankUnlocked && <Lock size={10} />}
                      </label>
                      <input 
                        className={cn(
                          "w-full px-3 py-3 text-sm rounded outline-none transition-colors",
                          isBankUnlocked 
                            ? "bg-[#151515] border border-[#333] text-stone-200 focus:border-stone-500 shadow-[0_0_15px_rgba(255,255,255,0.02)]" 
                            : "bg-[#0a0a0a]/50 border border-[#222] text-stone-500 cursor-not-allowed"
                        )}
                        value={data.bankDetails.holderName}
                        onChange={e => setData({...data, bankDetails: {...data.bankDetails, holderName: e.target.value}})}
                        readOnly={!isBankUnlocked}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest flex items-center gap-2">
                        A/C Number {!isBankUnlocked && <Lock size={10} />}
                      </label>
                      <input 
                        className={cn(
                          "w-full px-3 py-3 text-sm rounded outline-none transition-colors",
                          isBankUnlocked 
                            ? "bg-[#151515] border border-[#333] text-stone-200 focus:border-stone-500 shadow-[0_0_15px_rgba(255,255,255,0.02)]" 
                            : "bg-[#0a0a0a]/50 border border-[#222] text-stone-500 cursor-not-allowed"
                        )}
                        value={data.bankDetails.accountNumber}
                        onChange={e => setData({...data, bankDetails: {...data.bankDetails, accountNumber: e.target.value}})}
                        readOnly={!isBankUnlocked}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest flex items-center gap-2">
                        IFSC {!isBankUnlocked && <Lock size={10} />}
                      </label>
                      <input 
                        className={cn(
                          "w-full px-3 py-3 text-sm rounded outline-none transition-colors",
                          isBankUnlocked 
                            ? "bg-[#151515] border border-[#333] text-stone-200 focus:border-stone-500 shadow-[0_0_15px_rgba(255,255,255,0.02)]" 
                            : "bg-[#0a0a0a]/50 border border-[#222] text-stone-500 cursor-not-allowed"
                        )}
                        value={data.bankDetails.ifsc}
                        onChange={e => setData({...data, bankDetails: {...data.bankDetails, ifsc: e.target.value}})}
                        readOnly={!isBankUnlocked}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Validity Date</label>
                      <input 
                        className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors shadow-[0_0_15px_rgba(255,255,255,0.02)]"
                        value={data.validUntil}
                        onChange={e => setData({...data, validUntil: e.target.value})}
                      />
                    </div>
                  </div>
                </section>

                {/* Client Box */}
                <section className="space-y-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Client Details</h2>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Recipient</label>
                    <input 
                      className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors"
                      value={data.billTo.clientName}
                      onChange={e => setData({...data, billTo: {...data.billTo, clientName: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Address</label>
                    <textarea 
                      className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded h-24 outline-none resize-none focus:border-stone-500 transition-colors"
                      value={data.billTo.address}
                      onChange={e => setData({...data, billTo: {...data.billTo, address: e.target.value}})}
                    />
                  </div>
                </section>

                {/* Items */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Line Items</h2>
                    <button 
                      onClick={handleAddItem}
                      className="text-[10px] font-black text-stone-100 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.items.map((item) => (
                      <div key={item.id} className="p-4 bg-[#111] border border-[#222] rounded relative group hover:border-[#333] transition-all">
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="absolute -right-2 -top-2 bg-[#1a1a1a] border border-[#333] p-1.5 text-stone-500 hover:text-red-400 rounded transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div className="space-y-3">
                          <input 
                            className="w-full bg-transparent border-none p-0 text-sm font-medium text-white placeholder-stone-700 outline-none"
                            value={item.description}
                            placeholder="Description..."
                            onChange={e => handleUpdateItem(item.id, { description: e.target.value })}
                          />
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-[8px] uppercase text-stone-600 font-bold mb-1">Code</p>
                              <input 
                                className="w-full bg-[#151515] border border-[#222] px-2 py-1.5 text-xs text-stone-300 rounded"
                                value={item.sampleCode}
                                onChange={e => handleUpdateItem(item.id, { sampleCode: e.target.value })}
                              />
                            </div>
                            <div>
                              <p className="text-[8px] uppercase text-stone-600 font-bold mb-1">Qty</p>
                              <input 
                                type="number"
                                className="w-full bg-[#151515] border border-[#222] px-2 py-1.5 text-xs text-stone-300 rounded"
                                value={item.quantity}
                                onChange={e => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                              />
                            </div>
                            <div>
                              <p className="text-[8px] uppercase text-stone-600 font-bold mb-1">Rate</p>
                              <input 
                                type="number"
                                className="w-full bg-[#151515] border border-[#222] px-2 py-1.5 text-xs text-stone-300 rounded"
                                value={item.rate}
                                onChange={e => handleUpdateItem(item.id, { rate: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Adjustments */}
                <div className="mt-8 pt-8 border-t border-[#222]">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-4">Settings & Extra Costs</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Discount (%)</label>
                      <input 
                        type="number"
                        className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors"
                        value={data.discountPercent}
                        onChange={e => setData({...data, discountPercent: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Logistics (/sqft)</label>
                      <input 
                        type="number"
                        className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors"
                        value={data.logisticsRate}
                        onChange={e => setData({...data, logisticsRate: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Tax (IGST %)</label>
                      <input 
                        type="number"
                        className="w-full bg-[#151515] border border-[#333] px-3 py-3 text-sm text-stone-200 rounded focus:border-stone-500 outline-none transition-colors"
                        value={data.taxPercent}
                        onChange={e => setData({...data, taxPercent: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5 opacity-60">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-widest leading-none">Auto-Calculated Advance</label>
                      <div className="w-full bg-[#151515] border border-[#222] px-3 py-3 text-sm text-stone-400 rounded">
                        {formatCurrency(calculatedFields.advanceAmount)}
                      </div>
                      <p className="text-[8px] text-stone-600 font-bold uppercase mt-1">({calculatedFields.advancePercentage}% of grand total)</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ai"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="p-6 bg-[#111] border border-[#222] rounded">
                  <div className="flex items-center gap-3 mb-6">
                    <Zap size={18} className="text-stone-100" fill="currentColor" />
                    <h2 className="text-xs uppercase font-black tracking-widest text-white">Smart AI Paste</h2>
                  </div>
                  <textarea 
                    className="w-full h-80 bg-[#151515] border border-[#333] p-4 text-sm text-stone-200 rounded outline-none resize-none focus:border-stone-500 transition-all shadow-inner"
                    placeholder="Paste email content or WhatsApp messages here..."
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                  />
                  <div className="mt-6 flex gap-4">
                    <button 
                      onClick={() => setAiInput('')}
                      className="flex-1 border border-[#333] py-3 rounded text-[10px] font-black uppercase text-stone-500 hover:bg-[#1a1a1a] transition-colors"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={handleAiExtract}
                      disabled={isExtracting || !aiInput.trim()}
                      className="flex-[2] bg-stone-100 text-black py-3 rounded text-[10px] font-black uppercase hover:bg-white transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isExtracting ? 'Organizing...' : 'Populate Form'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions in Sidebar */}
        <div className="p-8 border-t border-[#222] space-y-3 mt-auto bg-[#0a0a0a]">
          <button 
            onClick={downloadPdf}
            disabled={isDownloading}
            className="w-full bg-stone-100 text-black py-4 rounded font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50 disabled:scale-100"
          >
            {isDownloading ? (
              <>
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download size={16} strokeWidth={2.5} />
                <span>Download Final PDF</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 bg-[#121212] overflow-y-auto p-4 md:p-12 flex items-start justify-center custom-scrollbar">
        <div className="max-w-full md:max-w-[850px] w-full space-y-8 animate-in fade-in duration-700">
          <div className="flex items-center justify-between text-stone-600 mb-4 px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Document Preview</h2>
            <div className="flex gap-2 items-center">
               <div className="h-1 w-1 bg-green-500 rounded-full animate-pulse" />
               <span className="text-[9px] uppercase tracking-widest font-bold">A4 Multipage Active</span>
            </div>
          </div>
          
          <div 
            ref={pagesRef}
            className="flex flex-col gap-12 items-center origin-top transform-gpu scale-[0.4] sm:scale-[0.6] md:scale-100 transition-transform duration-500"
          >
            {/* Page 1: Main Quotation */}
            <div className="pdf-page bg-white shadow-2xl p-14 flex flex-col relative border border-stone-200" style={{ width: '210mm', minHeight: '297mm' }}>
              {/* Luxury Header */}
              <div className="flex justify-between items-start border-b-2 border-stone-900 pb-10 mb-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-stone-900 text-white flex items-center justify-center rounded-sm font-serif text-3xl font-bold">W</div>
                    <div>
                      <h2 className="text-3xl font-serif font-black text-stone-900 tracking-tight leading-none uppercase">{data.companyName}</h2>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mt-2">Bespoke Architectural Surfaces</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-500 space-y-0.5 font-bold uppercase tracking-widest">
                    <p>#4, Ground Floor, Koramangala Bengaluru</p>
                    <p>GSTIN: {data.gstin}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-5xl font-serif font-light text-stone-200 tracking-tighter uppercase mb-4">Quotation</h3>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[11px] font-black text-stone-900 uppercase tracking-widest bg-stone-100 px-3 py-1.5 border border-stone-200">Ref: {data.quotationNo}</p>
                    <p className="text-[10px] font-bold text-stone-400 mt-1">{data.date}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-16 mb-12">
                <div className="space-y-4">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 border-b border-stone-100 pb-2">Client Identity</h4>
                  <div className="space-y-1">
                    <p className="text-lg font-serif font-bold text-stone-900 uppercase tracking-tight">{data.billTo.clientName}</p>
                    <p className="text-[11px] text-stone-500 leading-relaxed font-medium">{data.billTo.address}</p>
                  </div>
                </div>
                <div className="space-y-4 text-right">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-400 border-b border-stone-100 pb-2 text-right">Project Details</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-stone-800 uppercase tracking-wider">{data.projectLocation}</p>
                    <div className="flex flex-col gap-1 items-end pt-2">
                      <div className="flex gap-2 text-[9px] font-bold">
                        <span className="text-stone-300 uppercase tracking-widest leading-none">Handled By:</span>
                        <span className="text-stone-900 border-b border-stone-100 tracking-wide">{data.handledBy}</span>
                      </div>
                      <div className="flex gap-2 text-[9px] font-bold">
                        <span className="text-stone-300 uppercase tracking-widest leading-none">Enquiry:</span>
                        <span className="text-stone-900">{data.enquiredBy}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Elegant Table */}
              <div className="flex-1">
                <table className="w-full text-left table-fixed border-collapse">
                  <thead>
                    <tr className="border-b border-stone-900">
                      <th className="py-4 px-2 text-[9px] font-black uppercase tracking-widest text-stone-900 w-12 italic">Sl.</th>
                      <th className="py-4 px-2 text-[9px] font-black uppercase tracking-widest text-stone-900">Description of Work</th>
                      <th className="py-4 px-2 text-[9px] font-black uppercase tracking-widest text-stone-900 text-right w-24">Sample</th>
                      <th className="py-4 px-2 text-[9px] font-black uppercase tracking-widest text-stone-900 text-center w-24">Qty/Sqft</th>
                      <th className="py-4 px-2 text-[9px] font-black uppercase tracking-widest text-stone-900 text-right w-24">Rate</th>
                      <th className="py-4 px-2 text-[9px] font-black uppercase tracking-widest text-stone-900 text-right w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody>{data.items.map((item, index) => (
                      <tr key={item.id} className="border-b border-stone-100 group transition-colors hover:bg-stone-50">
                        <td className="py-4 px-2 text-[10px] font-bold text-stone-300">{(index + 1).toString().padStart(2, '0')}</td>
                        <td className="py-4 px-2">
                          <p className="text-[11px] font-bold text-stone-900 uppercase tracking-tight leading-tight">{item.description}</p>
                        </td>
                        <td className="py-4 px-2 text-[10px] text-stone-500 text-right font-medium">{item.sampleCode || '—'}</td>
                        <td className="py-4 px-2 text-[11px] text-stone-900 text-center font-bold">{item.quantity}</td>
                        <td className="py-4 px-2 text-[11px] text-stone-900 text-right font-bold">{formatCurrency(item.rate)}</td>
                        <td className="py-4 px-2 text-[11px] text-stone-900 text-right font-black">{formatCurrency(item.quantity * item.rate)}</td>
                      </tr>
                    ))}
                    <tr className="font-black bg-stone-50 border-b-2 border-stone-900 shadow-inner">
                      <td colSpan={3} className="py-2.5 px-2 text-[11px] text-stone-900 uppercase tracking-widest text-right">Project Sub-Total</td>
                      <td className="py-2.5 px-2 text-center text-stone-900 border-x border-stone-200">{calculatedFields.totalQuantity}</td>
                      <td className="py-2.5 px-2 border-r border-stone-200"></td>
                      <td className="py-2.5 px-2 text-right text-stone-900 font-black">{formatCurrency(calculatedFields.rawTotal)}</td>
                    </tr>
                    <tr className="h-16 bg-white">
                      <td colSpan={6} className="text-center align-bottom pb-4">
                        <span className="text-[9px] font-black uppercase tracking-[0.6em] text-stone-300">Summary & Adjustments</span>
                      </td>
                    </tr>
                    <tr className="border-t-4 border-stone-900"><td colSpan={6}></td></tr>
                    <tr className="font-black bg-stone-50/50">
                      <td colSpan={3} className="py-3 px-2 text-[10px] text-red-600 uppercase tracking-widest text-right italic">Architect Discount -{data.discountPercent}%</td>
                      <td className="py-2 px-2 border-x border-stone-200"></td>
                      <td className="py-2 px-2 border-r border-stone-200"></td>
                      <td className="py-2 px-2 text-right text-red-600">{formatCurrency(calculatedFields.discountAmount)}</td>
                    </tr>
                    <tr className="font-black">
                      <td colSpan={3} className="py-2 px-2 text-[10px] text-green-600 uppercase tracking-widest text-right">Logistics-{data.logisticsRate}rs/sqft</td>
                      <td className="py-2 px-2 border-x border-stone-200"></td>
                      <td className="py-2 px-2 border-r border-stone-200"></td>
                      <td className="py-2 px-2 text-right text-green-600">{formatCurrency(calculatedFields.logisticsAmount)}</td>
                    </tr>
                    <tr className="font-black bg-stone-50">
                      <td colSpan={3} className="py-2 px-2 text-[10px] text-stone-500 uppercase tracking-widest text-right">Taxable Amount</td>
                      <td className="py-2 px-2 border-x border-stone-200"></td>
                      <td className="py-2 px-2 border-r border-stone-200"></td>
                      <td className="py-2 px-2 text-right text-stone-900">{formatCurrency(calculatedFields.taxableAmount)}</td>
                    </tr>
                    <tr className="font-black">
                      <td colSpan={3} className="py-2 px-2 text-[10px] text-green-600 uppercase tracking-widest text-right">Tax (IGST) – {data.taxPercent}%</td>
                      <td className="py-2 px-2 border-x border-stone-200"></td>
                      <td className="py-2 px-2 border-r border-stone-200"></td>
                      <td className="py-2 px-2 text-right text-green-600">{formatCurrency(calculatedFields.taxAmount)}</td>
                    </tr>
                    <tr className="font-black bg-stone-50">
                      <td colSpan={3} className="py-2 px-2 text-[10px] text-stone-500 uppercase tracking-widest text-right">Total</td>
                      <td className="py-2 px-2 border-x border-stone-200"></td>
                      <td className="py-2 px-2 border-r border-stone-200"></td>
                      <td className="py-2 px-2 text-right text-stone-900">{formatCurrency(calculatedFields.totalWithTax)}</td>
                    </tr>
                    <tr className="font-black bg-stone-900 text-white">
                      <td colSpan={3} className="py-2 px-2 text-[10px] uppercase tracking-widest text-right">Grand Total ( Round Off)</td>
                      <td className="py-2 px-2 border-x border-stone-900" style={{ borderColor: 'rgba(255,255,255,0.1)' }}></td>
                      <td className="py-2 px-2 border-r border-stone-900" style={{ borderColor: 'rgba(255,255,255,0.1)' }}></td>
                      <td className="py-2 px-2 text-right">{formatCurrency(calculatedFields.grandTotalRound)}</td>
                    </tr></tbody>
                </table>
              </div>

              {/* Advance Amount Section */}
              <div className="mt-8 border border-stone-900 p-4 text-center space-y-1">
                <p className="text-sm font-black uppercase tracking-widest text-stone-900">
                  Advance Amount : {formatCurrency(calculatedFields.advanceAmount)}
                </p>
                <p className="text-[10px] font-bold text-stone-900 uppercase">
                  AMOUNT in Words : {numberToWords(calculatedFields.advanceAmount)}
                </p>
              </div>

              {/* Bank Details Section */}
              <div className="mt-8 border border-stone-900 overflow-hidden">
                <div className="bg-white px-4 py-2 border-b border-stone-900">
                   <h3 className="text-[12px] font-black uppercase tracking-tight text-stone-900">Bank Details : {data.bankDetails.bankName}</h3>
                </div>
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-stone-200">
                      <td className="py-2 px-4 text-[10px] font-black text-stone-900 uppercase border-r border-stone-900 w-48">Holder Name</td>
                      <td className="py-2 px-4 text-[10px] font-bold text-blue-600 uppercase italic">{data.bankDetails.holderName}</td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="py-2 px-4 text-[10px] font-black text-stone-900 uppercase border-r border-stone-900">Account Number</td>
                      <td className="py-2 px-4 text-[10px] font-bold text-blue-600 uppercase italic">{data.bankDetails.accountNumber}</td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="py-2 px-4 text-[10px] font-black text-stone-900 uppercase border-r border-stone-900">IFSC</td>
                      <td className="py-2 px-4 text-[10px] font-bold text-blue-600 uppercase italic">{data.bankDetails.ifsc}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-[10px] font-black text-stone-900 uppercase border-r border-stone-900">Branch</td>
                      <td className="py-2 px-4 text-[10px] font-bold text-stone-900 uppercase italic">{data.bankDetails.branch}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Validity Section */}
              <div className="mt-12 border border-stone-900 p-2 text-center bg-stone-50">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-900 italic">
                  This quotation is valid only until {data.validUntil}
                </p>
              </div>

              {/* Watermark/Footer */}
              <div className="mt-auto pt-10 flex justify-between items-center border-t border-stone-100">
                <div className="text-[8px] text-stone-300 font-black uppercase tracking-[0.5em]">
                  <p>WKI / ARCHITECTURAL / SERIES</p>
                </div>
                <div className="text-[9px] text-stone-400 font-serif italic">
                  Document Page 01
                </div>
              </div>
            </div>

                {/* Page 2: Financial Terms */}
                <div className="pdf-page bg-white shadow-2xl p-16 flex flex-col relative border border-stone-200" style={{ width: '210mm', minHeight: '297mm' }}>
                  <div className="flex justify-between items-start border-b-2 border-stone-900 pb-10 mb-10">
                    <div>
                      <h2 className="text-2xl font-serif font-black text-stone-900 uppercase tracking-tight">Financial Governance</h2>
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.4em] mt-2">Terms & Commercial Protocols</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">{data.companyName}</p>
                       <p className="text-[9px] text-stone-400 mt-1">Ref: {data.quotationNo}</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <table className="w-full text-left border-stone-900 border-collapse">
                      <tbody>{calculatedFields.financialTerms.map((term, idx) => (
                          <tr key={idx} className="border-b border-stone-100 group transition-colors hover:bg-stone-50">
                            <td className="w-12 py-4 px-2 text-[10px] font-black text-stone-300">{(idx + 1).toString().padStart(2, '0')}</td>
                            <td className="py-4 px-4 text-[11px] font-medium text-stone-700 leading-relaxed italic pr-12">{term}</td>
                          </tr>
                        ))}</tbody>
                    </table>
                  </div>

                  <div className="mt-auto pt-10 flex justify-between items-center border-t border-stone-100">
                    <div className="text-[8px] text-stone-300 font-black uppercase tracking-[0.5em]">
                      <p>WKI / ARCHITECTURAL / SERIES</p>
                    </div>
                    <div className="text-[9px] text-stone-400 font-serif italic text-right">
                      Document Page 02
                    </div>
                  </div>
                </div>

                {/* Page 3: Important Terms */}
                <div className="pdf-page bg-white shadow-2xl p-16 flex flex-col relative border border-stone-200" style={{ width: '210mm', minHeight: '297mm' }}>
                  <div className="flex justify-between items-start border-b-2 border-stone-900 pb-10 mb-10">
                    <div>
                      <h2 className="text-2xl font-serif font-black text-stone-900 uppercase tracking-tight">Execution Protocol</h2>
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.4em] mt-2">Important Operational Terms</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">{data.companyName}</p>
                       <p className="text-[9px] text-stone-400 mt-1">Ref: {data.quotationNo}</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <table className="w-full text-left border-stone-900 border-collapse">
                      <tbody>{calculatedFields.executionTerms.map((term, idx) => (
                          <tr key={idx} className="border-b border-stone-100 group transition-colors hover:bg-stone-50">
                            <td className="w-12 py-4 px-2 text-[10px] font-black text-stone-300">{(idx + 1).toString().padStart(2, '0')}</td>
                            <td className="py-4 px-4 text-[11px] font-medium text-stone-700 leading-relaxed italic pr-12">{term}</td>
                          </tr>
                        ))}</tbody>
                    </table>
                  </div>

                  <div className="mt-auto pt-10 flex justify-between items-center border-t border-stone-100">
                    <div className="text-[8px] text-stone-300 font-black uppercase tracking-[0.5em]">
                      <p>WKI / ARCHITECTURAL / SERIES</p>
                    </div>
                    <div className="text-[9px] text-stone-400 font-serif italic text-right">
                      Document Page 03
                    </div>
                  </div>
                </div>

                {/* Page 4: Logistics & Execution */}
                <div className="pdf-page bg-white shadow-2xl p-16 flex flex-col relative border border-stone-200" style={{ width: '210mm', minHeight: '297mm' }}>
                   <div className="flex justify-between items-start border-b-2 border-stone-900 pb-10 mb-10">
                    <div>
                      <h2 className="text-2xl font-serif font-black text-stone-900 uppercase tracking-tight">Logistics Framework</h2>
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.4em] mt-2">Execution & Site Sovereignty</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">{data.companyName}</p>
                       <p className="text-[9px] text-stone-400 mt-1">Ref: {data.quotationNo}</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <table className="w-full text-left border-stone-900 border-collapse">
                      <tbody>{calculatedFields.logisticsTerms.map((term, idx) => (
                          <tr key={idx} className="border-b border-stone-100 group transition-colors hover:bg-stone-50">
                            <td className="w-12 py-3 px-2 text-[10px] font-black text-stone-300">{(idx + 1).toString().padStart(2, '0')}</td>
                            <td className="py-3 px-4 text-[10px] font-medium text-stone-700 leading-tight italic pr-12">{term}</td>
                          </tr>
                        ))}</tbody>
                    </table>
                  </div>

                  <div className="mt-auto pt-10 flex justify-between items-center border-t border-stone-100">
                    <div className="text-[8px] text-stone-300 font-black uppercase tracking-[0.5em]">
                      <p>WKI / ARCHITECTURAL / SERIES</p>
                    </div>
                    <div className="text-[9px] text-stone-400 font-serif italic text-right">
                      Document Page 04
                    </div>
                  </div>
                </div>

                {/* Page 5: Measurement Approval */}
                <div className="pdf-page bg-white shadow-2xl p-16 flex flex-col relative border border-stone-200" style={{ width: '210mm', minHeight: '297mm' }}>
                   <div className="flex justify-between items-start border-b-2 border-stone-900 pb-10 mb-10">
                    <div>
                      <h2 className="text-2xl font-serif font-black text-stone-900 uppercase tracking-tight">Project Closure</h2>
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.4em] mt-2">Measurement & Final Acceptance</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">{data.companyName}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                     <div className="p-8 border border-stone-100 bg-stone-50">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-6 italic">Measurement Validation Options</h3>
                        <div className="space-y-4">
                           {[
                             { title: "Joint Measurement", desc: "100% joint measurement Within 3 Days of completion of project.", charge: "Complimentary" },
                             { title: "Spot Check", desc: "Verification of maximum 10% of the project. Within 3 Days.", charge: "Complimentary" },
                             { title: "Audit Measurement", desc: "100% verification by client representative. Within 7 Days.", charge: "Rs.5/- per sqft" }
                           ].map((opt, i) => (
                             <div key={i} className="flex gap-6 items-start">
                                <div className="h-5 w-5 border-2 border-stone-900 mt-0.5" />
                                <div>
                                  <p className="text-[11px] font-black text-stone-900 uppercase tracking-tight">{opt.title}</p>
                                  <p className="text-[10px] text-stone-500 mt-1 font-medium italic">{opt.desc}</p>
                                </div>
                                <div className="ml-auto text-[10px] font-black text-stone-900 whitespace-nowrap">{opt.charge}</div>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-12 mt-12">
                        <div className="p-10 border border-stone-900 flex flex-col items-center min-h-[220px] bg-stone-50">
                           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 self-start mb-auto">Executive Endorsement</span>
                           <div className="w-full h-24 border-b border-stone-100 mb-4 flex flex-col items-center justify-end pb-2">
                              <p className="text-[10px] font-black text-stone-900 uppercase tracking-tight mb-2">FOR WE KEY INTERIO INDIA PRIVATE LIMITED</p>
                              <p className="font-cursive text-2xl text-stone-900">{data.signatureName}</p>
                           </div>
                           <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mt-1">Authorized Representative</p>
                        </div>
                        <div className="p-10 border border-stone-200 flex flex-col items-center min-h-[220px]">
                           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 self-start mb-auto">Client Acceptance</span>
                           <div className="w-full h-24 border-b border-stone-100 mb-4 flex items-center justify-center">
                              <p className="text-2xl font-cursive text-stone-300 select-none" style={{ opacity: 0.3 }}>Signature Required</p>
                           </div>
                           <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Client / Principal Architect</p>
                           <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mt-1">Acceptance of all terms</p>
                        </div>
                     </div>
                  </div>

                  <div className="mt-auto pt-10 flex justify-between items-center border-t border-stone-100">
                    <div className="text-[8px] text-stone-300 font-black uppercase tracking-[0.5em]">
                      <p>WKI / ARCHITECTURAL / SERIES</p>
                    </div>
                    <div className="text-[9px] text-stone-400 font-serif italic text-right">
                      Document Page 05
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

      <style>{`
        .pdf-page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          color: black;
          font-family: 'Inter', sans-serif;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .pdf-page::before {
          content: 'WE KEY INTERIO';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 8rem;
          font-weight: 900;
          color: rgba(0, 0, 0, 0.03);
          white-space: nowrap;
          pointer-events: none;
          z-index: 0;
          letter-spacing: 0.2em;
        }

        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Global hide scrollbar but keep scroll functionality */
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        *::-webkit-scrollbar {
          display: none;
        }
        
        .font-cursive {
          font-family: 'Dancing Script', cursive;
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
    </div>
  );
}
