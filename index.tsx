import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { get, set } from 'idb-keyval';
import toast from 'react-hot-toast';

// New modular imports
import type { AspectRatio, BgTheme, MobileTab, LogoPosition, Template, SavedImage, BrandColors, Preset } from '@/src/types';
import { processImageFile, generateCalendarGrid } from '@/src/utils/imageProcessing';
import { parseError, ErrorType } from '@/src/utils/errorHandling';
import { ToastProvider } from '@/src/components/Toast';
import { DragDropZone } from '@/src/components/DragDropZone';
import { PresetManager } from '@/src/components/PresetManager';
import { ColorPicker } from '@/src/components/ColorPicker';

// --- Constants ---

const TEMPLATES: Template[] = [
  {
    id: 'studio-ops',
    title: 'Studio Operations',
    subtitle: '스튜디오 운영 및 중요 공지',
    description: '휴무일, 단축 운영, 정책 변경 등 공식적이고 시급한 정보',
    icon: 'fa-bullhorn',
    color: 'text-red-500',
    fields: [
      { id: 'mainTitle', label: 'Main Title (주제)', placeholder: 'e.g., 12월 25일 휴무', type: 'text' },
      { id: 'details', label: 'Details (세부 정보)', placeholder: 'e.g., 2024.12.25 All Classes Cancelled', type: 'textarea' },
      { id: 'footer', label: 'Footer (문의)', placeholder: 'e.g., Please contact us', type: 'text' }
    ],
    promptBase: `
      **Category: Studio Operations & Notices**
      **Style:** Official, Urgent, Professional, F45 Tone. **NO NEON EFFECTS.**
      **Essential Visual Elements:**
      1.  **Signature Header:** A **RED RECTANGULAR BOX** in the top right or center containing the Main Title.
      2.  **Background:** Clean, matte finish.
      3.  **Typography:** Big, bold, authoritative fonts.
    `
  },
  {
    id: 'events',
    title: 'Events & Promotions',
    subtitle: '이벤트 및 프로모션',
    description: '챌린지, 럭키드로우, 회원권 행사 등 화려한 비주얼',
    icon: 'fa-gift',
    color: 'text-yellow-400',
    fields: [
      { id: 'title', label: 'Event Title (타이틀)', placeholder: 'e.g., LUCKY DRAW', type: 'text' },
      { id: 'info', label: 'Period & Prizes (기간/상품)', placeholder: 'e.g., 1등: 애플워치, 기간: 3월 한달간', type: 'textarea' },
      { id: 'cta', label: 'CTA Button Text', placeholder: 'e.g., Register Now', type: 'text' }
    ],
    promptBase: `
      **Category: Events & Promotions**
      **Style:** Festive, Energetic, High-End 3D, Vibrant. **NO NEON GLOWS (unless specified for icon).**
      **Essential Visual Elements:**
      1.  **Key Visual:** High-quality **3D OBJECT** in the center (e.g., Gift Box, Dumbbell, Trophy).
      2.  **Effects:** **Spotlights**, **Confetti**, Light flares (clean lighting, not neon).
      3.  **Title:** 3D or Gradient text, very bold and catchy.
    `
  },
  {
    id: 'calendar',
    title: 'Monthly Calendar',
    subtitle: '월간 캘린더',
    description: '월별 스케줄, 주요 일정 안내 (모던 그리드 스타일)',
    icon: 'fa-calendar-alt',
    color: 'text-cyan-400',
    fields: [
      { id: 'year', label: 'Year (년도)', placeholder: 'e.g., 2025', type: 'text' },
      { id: 'month', label: 'Month (월)', placeholder: 'e.g., 5', type: 'text' },
      { id: 'events', label: 'Key Dates (주요 일정)', placeholder: 'e.g., 5th: Rest, 14th: Valentine Event', type: 'textarea' }
    ],
    promptBase: `
      **Category: Monthly Calendar**
      **Style:** Futuristic, Clean, Modern. **NO NEON TUBES.**
      **Essential Visual Elements:**
      1.  **Grid:** **Clean, Thin White Lines** for the calendar grid.
      2.  **Header:** Huge, bold English month/year (derived from inputs) at the top.
      3.  **Icons:** Minimalist line-art icons placed in the grid cells for special dates.
      4.  **Background:** Large, faint F45 Logo watermark behind the grid.
      5.  **Colors:** Cool Blue/White for weekdays, Red for holidays/events.
    `
  },
  {
    id: 'guide',
    title: 'User Guide',
    subtitle: '이용 가이드 및 브랜드 소개',
    description: '앱 다운로드, 운동 소개 등 카드 뉴스 형태',
    icon: 'fa-info-circle',
    color: 'text-white',
    fields: [
      { id: 'title', label: 'Guide Title (제목)', placeholder: 'e.g., F45 체험 신청 방법', type: 'text' },
      { id: 'steps', label: 'Steps/Content (내용)', placeholder: 'e.g., Step 1: Download App, Step 2: Sign Up', type: 'textarea' }
    ],
    promptBase: `
      **Category: User Guides & Info**
      **Style:** Clean, UI/UX focus, Friendly. **NO NEON.**
      **Essential Visual Elements:**
      1.  **Container:** **White Rounded Rectangular Card** placed on a deep navy background.
      2.  **Indicators:** Labels like "STEP 1", "STEP 2" clearly visible.
      3.  **Visuals:** Vector icons (Heart, Muscle) or App Mockups illustrating the steps.
      4.  **Layout:** Organized top-down or side-by-side within the card.
    `
  }
];

// --- Application Component ---

const App = () => {
  // API & Template State
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Image Generation State
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [variationCount, setVariationCount] = useState(2);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // UI State
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');

  // Logo State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('top-right');
  const [logoSize, setLogoSize] = useState<number>(100); // NEW: #38

  // Background State
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPrompt, setBgPrompt] = useState<string>('');
  const [bgTheme, setBgTheme] = useState<BgTheme>('dark');
  const [bgOpacity, setBgOpacity] = useState<number>(20);
  const [customIconPrompt, setCustomIconPrompt] = useState<string>('');

  // Brand Colors State - NEW: #37
  const [brandColors, setBrandColors] = useState<BrandColors>({
    primary: '#EE3124',    // F45 Red
    secondary: '#211551',  // F45 Navy
    textColor: '#FFFFFF'   // White
  });

  // Caption State
  const [captionKeywords, setCaptionKeywords] = useState('');
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);

  // Refs
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkApiKey();
    loadSavedImages();
  }, []);

  const loadSavedImages = async () => {
    try {
      const stored = await get('f45_saved_images');
      if (stored && Array.isArray(stored)) {
        setSavedImages(stored);
      }
    } catch (e) {
      console.error("Failed to load images from DB", e);
    }
  };

  const checkApiKey = async () => {
    // First check if environment variable exists
    if (process.env.API_KEY) {
      setApiKeySelected(true);
      return;
    }

    // For AI Studio platform (if available)
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
    } else {
      // On Vercel or other platforms, skip API key check
      // Users will enter it directly in the UI
      setApiKeySelected(true);
    }
  };

  const handleSelectKey = async () => {
    // For AI Studio platform
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
    } else {
      // For Vercel deployment, prompt user to enter API key
      const apiKey = prompt('Please enter your Google Gemini API key:');
      if (apiKey && apiKey.trim()) {
        // Store in sessionStorage for this session
        sessionStorage.setItem('GEMINI_API_KEY', apiKey.trim());
        setApiKeySelected(true);
      }
    }
  };

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    setFormValues({});
    setError(null);
  };

  // Helper to get API key from sessionStorage or environment
  const getApiKey = (): string => {
    // Check sessionStorage first (user input)
    const sessionKey = sessionStorage.getItem('GEMINI_API_KEY');
    if (sessionKey) return sessionKey;

    // Check Vite environment variables (Vercel deployment)
    if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
    if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;

    return '';
  };

  const handleInputChange = (id: string, value: string) => {
    setFormValues(prev => ({ ...prev, [id]: value }));
  };

  const handleClearGallery = async () => {
    if (window.confirm("Are you sure you want to delete ALL saved images? This cannot be undone.")) {
      setSavedImages([]);
      await set('f45_saved_images', []);
      toast.success('🗑️ Gallery cleared');
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (window.confirm("Delete this image?")) {
      const updated = savedImages.filter(img => img.id !== id);
      setSavedImages(updated);
      await set('f45_saved_images', updated);
      toast.success('Image deleted');
    }
  };

  // NEW: Preset loading handler (#16)
  const handleLoadPreset = (preset: Preset) => {
    setSelectedTemplateId(preset.templateId);
    setFormValues(preset.formValues);
    setAspectRatio(preset.aspectRatio);
    setBgTheme(preset.bgTheme);
    setBgOpacity(preset.bgOpacity);
    if (preset.brandColors) setBrandColors(preset.brandColors);
    if (preset.logoSize) setLogoSize(preset.logoSize);
  };

  const generateCaptions = async () => {
    if (!captionKeywords.trim()) return;
    setIsGeneratingCaptions(true);
    setGeneratedCaptions([]);

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          Act as a social media manager for F45 Training.
          Write 2 distinct versions of an Instagram caption based on these keywords: "${captionKeywords}".
          
          Guidelines:
          1. Tone: Energetic, Fun, Encouraging, Community-focused.
          2. Use emojis generously but tastefully.
          3. **Include 5-7 relevant hashtags** at the bottom (e.g., #F45, #TeamTraining, etc.).
          4. **Use line breaks** to make the text easy to read.
          5. Keep the main text concise (under 300 characters approx).
          6. Return ONLY the two captions separated by "|||". Do not add "Version 1" labels.
        `
      });

      const text = response.text || "";
      const captions = text.split('|||').map(c => c.trim()).filter(c => c.length > 0);
      setGeneratedCaptions(captions.slice(0, 2));
      toast.success('✨ Captions generated!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate captions');
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('📋 Caption copied!');
  };

  const generateImages = async () => {
    if (!selectedTemplateId) return;

    setIsGenerating(true);
    setError(null);
    setMobileTab('gallery');

    try {
      const ai = new GoogleGenAI({ apiKey: getApiKey() });
      const template = TEMPLATES.find(t => t.id === selectedTemplateId)!;

      let calendarPromptAddition = "";
      if (selectedTemplateId === 'calendar') {
        const year = parseInt(formValues['year']);
        const month = parseInt(formValues['month']);

        if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
          const grid = generateCalendarGrid(year, month);
          calendarPromptAddition = `
              \n**CRITICAL INSTRUCTION - CALENDAR GRID ACCURACY:**
              You MUST render the calendar grid EXACTLY as shown below:
              \`\`\`
              Year: ${year}, Month: ${month}
              ${grid}
              \`\`\`
              `;
        }
      }

      let userContent = "";
      Object.entries(formValues).forEach(([key, value]) => {
        const label = template.fields.find(f => f.id === key)?.label || key;
        const cleanLabel = label.split('(')[0].trim();
        userContent += `${cleanLabel}: "${value}"\n`;
      });

      // NEW: Use brand colors (#37)
      const titleColor = bgTheme === 'dark' ? brandColors.textColor : '#221551';
      const bgInstruction = bgTheme === 'dark' ? 'General Theme: DARK.' : 'General Theme: LIGHT.';

      const ctaValue = formValues['cta'];
      const hasCtaInput = ctaValue && ctaValue.trim().length > 0;

      // NEW: Use custom primary color for CTA (#37)
      let ctaInstruction = hasCtaInput ? `
        **CTA BUTTON (Important):**
        - Text: "${ctaValue}"
        - Shape: Solid Rectangle at the bottom.
        - Color: **${brandColors.primary}**.
        - Style: **FLAT & SOLID**.
      ` : `**CTA / BUTTONS:** DO NOT render any buttons.`;

      const parts: any[] = [];
      let promptText = `
        Create a high-quality Instagram notice image for an F45 Training studio.
        
        **STRICT TEXT RENDERING PROTOCOL:**
        1. **ONLY** render provided text.
        2. **DO NOT** add extra text.
        3. If value is empty, do not render.
        
        **Category:** ${template.title}
        ${template.promptBase}
        ${calendarPromptAddition}
        ${ctaInstruction}

        **Theme & Typography:**
        - Background: ${bgInstruction}
        - Title Color: ${titleColor}
        - English: MUST use **'Gotham'** (Bold).
        - Korean: MUST use **'Noto Sans KR'**.

        **Brand Colors:**
        - Primary: ${brandColors.primary}
        - Secondary: ${brandColors.secondary}
        - Text: ${brandColors.textColor}

        **CONTENT TO RENDER:**
        ${userContent}
      `;

      let imageIndex = 1;
      if (logoFile) {
        const { base64, mimeType } = await processImageFile(logoFile);
        parts.push({ inlineData: { mimeType, data: base64 } });
        const posText = logoPosition.split('-').map(s => s.toUpperCase()).join(' ');
        // NEW: Add logo size info (#38)
        promptText += `\n**Reference Image ${imageIndex} (LOGO):** Place strictly in **${posText}**. Scale to **${logoSize}%** of default size. Keep original colors.`;
        imageIndex++;
      }

      if (bgFile) {
        const { base64, mimeType } = await processImageFile(bgFile);
        parts.push({ inlineData: { mimeType, data: base64 } });
        promptText += `\n**Reference Image ${imageIndex} (BACKGROUND):** Apply at **${bgOpacity}% opacity** over solid ${bgTheme} color.`;
        imageIndex++;
      } else if (bgPrompt.trim()) {
        promptText += `\n**BACKGROUND GENERATION:** Depict: "${bgPrompt}". Visible at **${bgOpacity}% opacity** under text.`;
      }

      if (customIconPrompt.trim()) {
        promptText += `\n**Central Icon:** Custom **NEON STYLE** icon of: "${customIconPrompt}".`;
      }

      promptText += `\n**Aspect Ratio:** ${aspectRatio} \n**Vibe:** F45 Premium community.`;
      parts.push({ text: promptText });

      const promises = Array.from({ length: variationCount }).map(async () => {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: parts },
            config: {
              imageConfig: { aspectRatio: aspectRatio, imageSize: "1K" }
            }
          });

          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        } catch (innerErr: any) {
          if (innerErr.message?.includes("Requested entity was not found")) {
            throw innerErr;
          }
          console.error("Individual image failed:", innerErr);
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validImages = results.filter((img): img is string => img !== null);

      if (validImages.length === 0) {
        throw new Error("Generation failed. Please check your API key / project billing.");
      }

      const newSavedImages: SavedImage[] = validImages.map(imgData => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        data: imgData,
        templateId: selectedTemplateId!,
        timestamp: new Date().toISOString()
      }));

      const updatedList = [...newSavedImages, ...savedImages];
      setSavedImages(updatedList);
      await set('f45_saved_images', updatedList);

      // NEW: Success feedback (#28)
      toast.success(`✨ ${validImages.length} image${validImages.length > 1 ? 's' : ''} generated!`, {
        duration: 4000,
      });

      // Auto-scroll to gallery (#28)
      setTimeout(() => {
        galleryRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);

    } catch (err: any) {
      console.error(err);

      // NEW: Improved error handling (#21)
      const errorInfo = parseError(err);
      setError(errorInfo.message);

      toast.error(errorInfo.message, {
        duration: 5000,
        icon: '⚠️'
      });

      if (errorInfo.type === ErrorType.API_KEY_INVALID) {
        setApiKeySelected(false);
      }

      console.error('Error details:', errorInfo);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!apiKeySelected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-900 text-center">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
          <div className="mb-6">
            <i className="fas fa-key text-6xl text-blue-500 animate-pulse"></i>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-white">Connect to Share</h1>
          <p className="text-gray-400 mb-8">
            This app uses high-quality Gemini 3 models. To use it, please select your own API key from a paid Google Cloud project.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <i className="fas fa-plug"></i> Connect API Key
          </button>
          <div className="mt-6 text-xs text-gray-500">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-blue-400">
              Why do I need a key? (Billing Info)
            </a>
          </div>
        </div>
      </div>
    );
  }

  const selectedTemplate = TEMPLATES.find(t => t.id === selectedTemplateId);

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#211551] text-white">
      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl z-[101]">&times;</button>
          <img src={lightboxImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fade-in" />
        </div>
      )}

      {/* Editor Panel */}
      <div className={`w-full lg:w-1/3 h-[calc(100vh-64px)] lg:h-screen overflow-y-auto custom-scrollbar p-6 border-r border-[#EE3124]/20 bg-[#1a0f3f] ${mobileTab === 'editor' ? 'block' : 'hidden'} lg:block`}>
        <header className="mb-8 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#EE3124] rounded-lg flex items-center justify-center shadow-lg shadow-[#EE3124]/30">
            <span className="text-white font-black text-3xl">F45</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Instagram Image Generator
            </h1>
            <p className="text-sm text-gray-400">F45 Training Studio</p>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">1. Select Template</h2>
          <div className="grid grid-cols-1 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => handleTemplateSelect(t.id)}
                className={`flex items-center p-4 rounded-xl border-2 transition-all text-left group
                  ${selectedTemplateId === t.id ? 'bg-[#1a0f3f] border-[#EE3124] shadow-lg shadow-[#EE3124]/20' : 'bg-[#1a0f3f]/50 border-transparent hover:bg-[#251560] hover:border-[#EE3124]/50'}
                `}
              >
                <div className={`w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center mr-4 ${t.color} text-lg shadow-inner`}>
                  <i className={`fas ${t.icon}`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-100">{t.title}</h3>
                  <p className="text-xs text-gray-400">{t.subtitle}</p>
                </div>
                {selectedTemplateId === t.id && <i className="fas fa-check ml-auto text-[#EE3124]"></i>}
              </button>
            ))}
          </div>
        </section>

        {selectedTemplate && (
          <section className="mb-8 animate-fade-in border border-[#EE3124]/30 bg-[#1a0f3f]/50 p-4 rounded-xl">
            <h2 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400 uppercase tracking-widest mb-3">
              <i className="fab fa-instagram mr-1"></i> Instagram Caption Helper
            </h2>
            <div className="mb-3">
              <input type="text" value={captionKeywords} onChange={(e) => setCaptionKeywords(e.target.value)} placeholder="Enter keywords" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs outline-none" />
            </div>
            <button onClick={generateCaptions} disabled={isGeneratingCaptions || !captionKeywords} className="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold flex items-center justify-center transition-colors">
              {isGeneratingCaptions ? <i className="fas fa-spinner fa-spin"></i> : "Generate Captions"}
            </button>
            {generatedCaptions.map((cap, idx) => (
              <div key={idx} className="bg-gray-900 p-2 rounded border border-gray-700 text-xs text-gray-300 relative mt-2 group">
                <p className="pr-6 whitespace-pre-wrap">{cap}</p>
                <button onClick={() => copyToClipboard(cap)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><i className="fas fa-copy"></i></button>
              </div>
            ))}
          </section>
        )}

        {selectedTemplate && (
          <section className="mb-8 animate-fade-in">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">2. Content Details</h2>
            <div className="space-y-4">
              {selectedTemplate.fields.map(field => (
                <div key={field.id}>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea value={formValues[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} placeholder={field.placeholder} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none h-24 resize-none" />
                  ) : (
                    <input type={field.type} value={formValues[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} placeholder={field.placeholder} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedTemplate && (
          <section className="pt-4 border-t border-gray-800 pb-20 lg:pb-0">
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">3. Visual Customization</label>

              {/* NEW: Preset Manager (#16) */}
              <PresetManager
                currentSettings={{
                  templateId: selectedTemplateId,
                  formValues,
                  aspectRatio,
                  bgTheme,
                  bgOpacity,
                  brandColors,
                  logoSize
                }}
                onLoadPreset={handleLoadPreset}
              />

              {/* NEW: Color Picker (#37) */}
              <ColorPicker
                colors={brandColors}
                onChange={setBrandColors}
              />

              {/* NEW: DragDropZone for Logo (#4) */}
              <div className="mb-4">
                <DragDropZone
                  onFileSelected={(file) => setLogoFile(file)}
                  label={logoFile ? 'Logo Selected' : 'Upload Logo (Drag or Click)'}
                  hasFile={!!logoFile}
                  icon="fa-image"
                />

                {/* Logo positioning */}
                {logoFile && (
                  <div className="mt-2 grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
                    {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as LogoPosition[]).map((pos) => (
                      <button key={pos} onClick={() => setLogoPosition(pos)} className={`h-8 rounded flex items-center justify-center transition-all ${logoPosition === pos ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                        <i className={`fas fa-dot-circle text-[8px]`}></i>
                      </button>
                    ))}
                  </div>
                )}

                {/* NEW: Logo Size Slider (#38) */}
                {logoFile && (
                  <div className="mt-3">
                    <label className="block text-xs text-gray-400 mb-1">
                      Logo Size: {logoSize}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="10"
                      value={logoSize}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* NEW: DragDropZone for Background (#4) */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-300 mb-1">Background Settings</label>
                <DragDropZone
                  onFileSelected={(file) => setBgFile(file)}
                  label={bgFile ? 'BG Image Selected' : 'Upload BG (Drag or Click)'}
                  hasFile={!!bgFile}
                  icon="fa-upload"
                />
                <input type="text" value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} placeholder="Or describe background to generate" className={`w-full bg-[#1a0f3f] border border-[#EE3124]/30 rounded-lg p-3 text-sm outline-none focus:border-[#EE3124] transition-colors mt-3 ${bgFile ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!!bgFile} />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setBgTheme('dark')} className={`flex-1 py-2 rounded text-xs font-bold transition-all ${bgTheme === 'dark' ? 'bg-[#EE3124] text-white' : 'bg-[#1a0f3f] text-gray-400 hover:bg-[#251560]'}`}>Dark</button>
                  <button onClick={() => setBgTheme('light')} className={`flex-1 py-2 rounded text-xs font-bold transition-all ${bgTheme === 'light' ? 'bg-[#EE3124] text-white' : 'bg-[#1a0f3f] text-gray-400 hover:bg-[#251560]'}`}>Light</button>
                  <button onClick={() => setBgTheme('vibrant')} className={`flex-1 py-2 rounded text-xs font-bold transition-all ${bgTheme === 'vibrant' ? 'bg-[#EE3124] text-white' : 'bg-[#1a0f3f] text-gray-400 hover:bg-[#251560]'}`}>Vibrant</button>
                </div>
              </div>

              <button onClick={generateImages} disabled={isGenerating} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all ${isGenerating ? 'bg-gray-700 text-gray-400' : 'bg-gradient-to-r from-[#EE3124] to-[#FF6B00] hover:from-[#FF6B00] hover:to-[#EE3124] text-white'}`}>
                {isGenerating ? <><i className="fas fa-spinner fa-spin mr-2"></i> Generating...</> : <><i className="fas fa-magic mr-2"></i> Generate Images</>}
              </button>
              {error && <p className="mt-3 text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900">{error}</p>}
            </div>
          </section>
        )}
      </div>

      {/* Gallery Panel */}
      <div ref={galleryRef} className={`w-full lg:w-2/3 h-[calc(100vh-64px)] lg:h-screen bg-black/50 p-8 overflow-y-auto custom-scrollbar ${mobileTab === 'gallery' ? 'block' : 'hidden'} lg:block`}>
        {savedImages.length === 0 && !isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <i className="fas fa-layer-group text-4xl mb-4 opacity-50"></i>
            <p className="text-xl font-medium">Select a template to begin</p>
          </div>
        ) : (
          <div className="pb-20 lg:pb-0">
            <header className="flex justify-between items-end mb-8">
              <h2 className="text-3xl font-bold text-white">Generated Gallery</h2>
              <button onClick={handleClearGallery} className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30 hover:bg-red-500/30">Clear All</button>
            </header>

            {isGenerating && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse mb-8">
                {[...Array(variationCount)].map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center relative overflow-hidden aspect-[3/4]">
                    <div className="absolute inset-0 bg-gradient-to-tr from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
                    <i className="fas fa-paint-brush text-3xl text-gray-600 animate-bounce"></i>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {savedImages.map((img) => (
                <div key={img.id} className="flex flex-col gap-3 group">
                  <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-800 aspect-auto">
                    <img src={img.data} alt="Generated" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                      <button onClick={() => setLightboxImage(img.data)} className="bg-gray-700 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-gray-600"><i className="fas fa-expand"></i></button>
                      <button onClick={() => handleDeleteImage(img.id)} className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-red-500"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  </div>
                  <a href={img.data} download={`f45-${img.id}.png`} className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-700 transition-colors font-semibold text-sm">
                    <i className="fas fa-download"></i> Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#1a0f3f] border-t border-[#EE3124]/20 flex z-40">
        <button onClick={() => setMobileTab('editor')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold transition-colors ${mobileTab === 'editor' ? 'text-[#EE3124]' : 'text-gray-500'}`}>
          <i className="fas fa-edit"></i>
          <span className="text-[10px]">Editor</span>
        </button>
        <button onClick={() => setMobileTab('gallery')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold transition-colors ${mobileTab === 'gallery' ? 'text-[#EE3124]' : 'text-gray-500'}`}>
          <i className="fas fa-images"></i>
          <span className="text-[10px]">Gallery</span>
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <>
    <ToastProvider />
    <App />
  </>
);