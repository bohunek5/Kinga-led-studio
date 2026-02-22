
import React, { useState, useEffect } from 'react';
import { CameraLens, RealismLevel, VisualStyle, AspectRatio, FormData, HistoryItem } from './types';
import { SectionTitle, TextInput, TextAreaInput, SelectInput, SliderInput, CheckboxGroup } from './components/InputComponents';
import { generateDetailedPrompt, generateImageFromPrompt } from './services/geminiService';

// The aistudio property is already defined in the global Window interface with the AIStudio type.
// We remove the conflicting local declaration to satisfy the compiler and avoid modifier mismatch.

const INITIAL_FORM: FormData = {
  scene: '',
  lightLocation: '',
  lightType: '',
  lightCharacter: [],
  lens: CameraLens.STANDARD,
  detailLevel: 7,
  dominantColor: '',
  realism: RealismLevel.INSTAGRAM,
  style: VisualStyle.MODERN_PREMIUM,
  hardwareVisibility: 'light_only',
  peoplePresence: 'none',
  contrastLevel: 3,
  usage: 'Social Media',
  additionalNotes: ''
};

const LightCharacterOptions = [
  "Miękkie / Rozproszone",
  "Ciągła linia (bez kropek)",
  "Mocny kontrast",
  "Delikatna łuna (Glow)",
  "Akcent dekoracyjny"
];

const MAX_HISTORY_LENGTH = 8; 

function App() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<Record<string, string> | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showQuotaError, setShowQuotaError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lumigen_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as HistoryItem[];
        setHistory(parsed);
      } catch (e) {
        localStorage.removeItem('lumigen_history');
      }
    }
  }, []);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const safeSaveHistory = (newItem: HistoryItem, currentHistory: HistoryItem[]) => {
    let updatedHistory = [newItem, ...currentHistory];
    if (updatedHistory.length > MAX_HISTORY_LENGTH) {
      updatedHistory = updatedHistory.slice(0, MAX_HISTORY_LENGTH);
    }

    let saved = false;
    while (!saved && updatedHistory.length > 0) {
      try {
        localStorage.setItem('lumigen_history', JSON.stringify(updatedHistory));
        saved = true;
      } catch (e) {
        if (updatedHistory.length > 1) {
          updatedHistory.pop(); 
        } else {
          break;
        }
      }
    }
    setHistory(updatedHistory);
  };

  const handleGenerate = async () => {
    if (!formData.scene) {
      alert("Proszę wpisać nazwę pomieszczenia lub obiektu.");
      return;
    }

    try {
      setIsGenerating(true);
      setShowQuotaError(false);
      setGeneratedImages(null);
      setGeneratedPrompt(null);
      
      setCurrentStep('Analiza sceny przez Gemini 3 Flash...');
      const prompt = await generateDetailedPrompt(formData);
      setGeneratedPrompt(prompt);

      const sessionSeed = Math.floor(Math.random() * 2147483647);
      const imagesMap: Record<string, string> = {};
      const formats = [AspectRatio.SQUARE, AspectRatio.LANDSCAPE, AspectRatio.PORTRAIT];
      
      for (let i = 0; i < formats.length; i++) {
        const ratio = formats[i];
        
        if (i > 0) {
          for (let countdown = 10; countdown > 0; countdown--) {
            setCurrentStep(`Stabilizacja API (odczekaj ${countdown}s)...`);
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        setCurrentStep(`Renderowanie formatu ${ratio} (Sesja ID: ${sessionSeed.toString().slice(-4)})...`);
        const result = await generateImageFromPrompt(prompt, ratio, sessionSeed);
        imagesMap[ratio] = result;
      }

      setGeneratedImages(imagesMap);

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        prompt: prompt,
        images: imagesMap,
        formData: { ...formData }
      };
      
      safeSaveHistory(newItem, history);

    } catch (error: any) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle quota errors and the specific "Requested entity was not found" error by prompting for key selection
      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("Requested entity was not found")) {
        setShowQuotaError(true);
      } else {
        alert(`Wystąpił problem: ${errorMessage}`);
      }
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setFormData(item.formData);
    setGeneratedImages(item.images);
    setGeneratedPrompt(item.prompt);
    setIsSidebarOpen(false);
  };

  const downloadImage = (url: string, ratio: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumigen-${ratio.replace(':', '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // No mandatory overlay for free models
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-led-bg text-gray-200 font-sans selection:bg-led-cyan selection:text-black">
      
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-slate-800 flex justify-between items-center bg-led-panel">
        <h1 className="text-xl font-bold bg-gradient-to-r from-led-cyan to-blue-500 bg-clip-text text-transparent">LumiGen</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* LEFT PANEL */}
      <div className={`
        flex-1 p-6 md:p-8 overflow-y-auto max-h-screen custom-scrollbar
        ${isSidebarOpen ? 'hidden' : 'block'}
      `}>
        <div className="max-w-2xl mx-auto">
          <header className="mb-8 hidden md:block flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-led-cyan to-blue-500 bg-clip-text text-transparent mb-2">
                LumiGen LED Studio
              </h1>
              <p className="text-slate-400 text-sm">Profesjonalne wizualizacje systemów liniowych LED.</p>
            </div>
          </header>

          <div className="space-y-8">
            {showQuotaError && (
              <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl animate-pulse">
                <h4 className="text-red-400 font-bold mb-1">Błąd limitu!</h4>
                <p className="text-sm text-red-300/80 mb-3">Osiągnięto limit darmowych generacji. Spróbuj ponownie za chwilę.</p>
              </div>
            )}

            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <SectionTitle>1. Podstawy Sceny</SectionTitle>
              <TextInput 
                label="Pomieszczenie / Obiekt" 
                placeholder="np. Nowoczesny salon, fasada biurowca"
                value={formData.scene}
                onChange={(e) => handleInputChange('scene', e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput 
                  label="Gdzie są linie światła?" 
                  placeholder="np. W suficie podwieszanym"
                  value={formData.lightLocation}
                  onChange={(e) => handleInputChange('lightLocation', e.target.value)}
                />
                <TextInput 
                  label="Barwa / Typ światła" 
                  placeholder="np. 3000K, RGB niebieski"
                  value={formData.lightType}
                  onChange={(e) => handleInputChange('lightType', e.target.value)}
                />
              </div>
              <CheckboxGroup 
                label="Charakter światła"
                options={LightCharacterOptions}
                selected={formData.lightCharacter}
                onChange={(val) => handleInputChange('lightCharacter', val)}
              />
            </section>

            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <SectionTitle>2. Kamera i Detale</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectInput 
                  label="Obiektyw"
                  options={Object.values(CameraLens).map(v => ({ label: v, value: v }))}
                  value={formData.lens}
                  onChange={(e) => handleInputChange('lens', e.target.value)}
                />
                 <SelectInput 
                  label="Poziom realizmu"
                  options={Object.values(RealismLevel).map(v => ({ label: v, value: v }))}
                  value={formData.realism}
                  onChange={(e) => handleInputChange('realism', e.target.value)}
                />
              </div>
              <div className="mt-4">
                <SliderInput 
                  label="Poziom szczegółów" 
                  min={1} max={10} 
                  value={formData.detailLevel}
                  onChange={(e) => handleInputChange('detailLevel', parseInt(e.target.value))}
                />
              </div>
            </section>

             <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <SectionTitle>3. Styl i Dopracowanie</SectionTitle>
              <SelectInput 
                label="Wybierz Styl"
                options={Object.values(VisualStyle).map(v => ({ label: v, value: v }))}
                value={formData.style}
                onChange={(e) => handleInputChange('style', e.target.value)}
              />
               <SliderInput 
                  label="Kontrast / Dramatyzm" 
                  min={1} max={5} 
                  value={formData.contrastLevel}
                  onChange={(e) => handleInputChange('contrastLevel', parseInt(e.target.value))}
                />
            </section>

            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
              <SectionTitle>4. Uwagi dodatkowe</SectionTitle>
              <TextAreaInput 
                label="Dodatkowe wytyczne dla AI"
                placeholder="np. Ściany z ciemnego betonu, za oknem deszczowa noc, meble w stylu bauhaus..."
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                description="AI uwzględni te uwagi przy generowaniu opisu."
              />
            </section>

            <div className="sticky bottom-4 z-10">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`
                  w-full py-4 rounded-lg font-bold text-lg tracking-wide shadow-xl
                  transition-all duration-300 flex items-center justify-center gap-2
                  ${isGenerating 
                    ? 'bg-slate-800 cursor-wait text-slate-500' 
                    : 'bg-gradient-to-r from-led-cyan to-blue-600 hover:to-blue-500 text-black shadow-led-cyan/10 hover:shadow-led-cyan/20'}
                `}
              >
                {isGenerating ? (
                   <>
                     <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     {currentStep}
                   </>
                ) : "Wygeneruj Triple-Pack LED"}
              </button>
            </div>
            <div className="h-10"></div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={`
        md:w-[500px] lg:w-[700px] border-l border-slate-800 bg-slate-900 flex flex-col
        fixed md:relative inset-0 z-20 md:z-auto
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="md:hidden p-4 border-b border-slate-800 flex justify-end">
          <button onClick={() => setIsSidebarOpen(false)} className="text-white font-bold">ZAMKNIJ</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {!isGenerating && generatedImages ? (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-led-cyan/20 pb-2">
                <h2 className="text-lg font-bold text-led-cyan uppercase tracking-widest">Ostatni Render</h2>
                <span className="text-[10px] text-slate-500 font-mono">Sync Seed Active</span>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(generatedImages).map(([ratio, url]) => (
                  <div key={ratio} className="bg-led-panel border border-slate-700 rounded-xl overflow-hidden shadow-2xl group">
                    <div className="flex justify-between items-center p-3 bg-slate-800/80">
                      <span className="text-xs font-bold text-led-cyan uppercase tracking-tighter">Format {ratio}</span>
                      <button 
                        onClick={() => downloadImage(url as string, ratio)}
                        className="text-[10px] bg-slate-700 hover:bg-led-cyan hover:text-black px-4 py-1.5 rounded-full font-bold transition-all"
                      >POBIERZ PLIK</button>
                    </div>
                    <img src={url as string} alt={`Format ${ratio}`} className="w-full h-auto" />
                  </div>
                ))}
              </div>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
               <div className="relative">
                  <div className="w-20 h-20 border-4 border-slate-800 border-t-led-cyan rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-800 border-b-blue-500 rounded-full animate-spin transition-all duration-1000"></div>
                  </div>
               </div>
               <div>
                 <h3 className="text-xl font-bold text-white mb-2">Trwa procesowanie...</h3>
                 <p className="text-led-cyan font-mono text-sm animate-pulse px-4">{currentStep}</p>
               </div>
               <div className="max-w-xs text-[11px] text-slate-500 leading-relaxed italic border-t border-slate-800 pt-4">
                 Synchronizacja seeda zapewnia identyczność ujęć w trzech różnych formatach. Odstępy czasowe chronią sesję przed odrzuceniem przez serwer graficzny.
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl mb-8">
              <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-sm">Uzupełnij parametry i kliknij generuj</p>
            </div>
          )}

          <div className="mt-12">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex justify-between">
              <span>Archiwum Wizualizacji</span>
              <span className="text-[10px] opacity-50">Max 8 ujęć</span>
            </h3>
            <div className="space-y-3">
              {history.map((item: HistoryItem) => (
                <div 
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="flex gap-4 p-3 bg-slate-800/20 rounded-xl border border-slate-800 hover:border-led-cyan/40 cursor-pointer transition-all group"
                >
                  <img src={item.images[AspectRatio.SQUARE] as string} alt="" className="w-14 h-14 object-cover rounded-lg shadow-lg border border-slate-700" />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-xs font-bold truncate group-hover:text-led-cyan transition-colors">{item.formData.scene}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-1 italic">{item.formData.style}</p>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-center text-[11px] text-slate-700 py-8">Historia jest pusta</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
