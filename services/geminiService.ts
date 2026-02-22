
import {GoogleGenAI} from "@google/genai";
import { FormData } from "../types";

const SYSTEM_INSTRUCTION = `
Jesteś ekspertem oświetlenia LED i fotografii architektury. Twoim zadaniem jest przekształcenie parametrów wejściowych użytkownika (w języku polskim) na JEDEN, spójny, wysoce szczegółowy prompt do generowania obrazów w języku ANGIELSKIM.

KRYTYCZNE ZASADY (STRICT RULES - NO SPOTS):
1. ABSOLUTNY ZAKAZ PUNKTÓW ŚWIETLNYCH: Nie generuj "downlights", "spotlights", "track lights", żarówek ani widocznych pojedynczych diod (dots).
2. TYLKO ŚWIATŁO LINIOWE: Całe oświetlenie musi pochodzić z ciągłych linii (linear profiles, LED strips, neon flex).
3. JEDNOLITA LINIA: Światło musi być idealnie rozproszone (diffused), bez widocznych przerw czy kropek (seamless COB effect).

Wytyczne do promptu:
- ZAWSZE używaj fraz: "continuous linear LED profiles", "seamless architectural light lines", "recessed linear lighting", "soft diffused strip light".
- Opisz światło jako idealną linię wpuszczoną w sufit/ścianę/podłogę.
- Jeśli użytkownik wybrał styl "Katalogowy", usuń wszelki bałagan i ludzi.
- Przetłumacz opis na techniczny język fotografii (np. "warm 3000K linear ambient glow").

Zwróć TYLKO treść promptu po angielsku. Bez wstępów.
`;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Generate a detailed prompt for the image generation model
export const generateDetailedPrompt = async (formData: FormData): Promise<string> => {
  // Always create a new instance right before the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const userContent = JSON.stringify(formData, null, 2);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
      contents: `Stwórz prompt na podstawie danych JSON. WAŻNE: Wygeneruj obraz TYLKO z liniami światła, żadnych spotów (NO SPOTLIGHTS)!\n${userContent}`,
    });

    // .text is a property, not a method
    return response.text || "Modern linear LED lighting in architectural space.";
  } catch (error) {
    console.error("Prompt Gen Error:", error);
    throw new Error("Nie udało się utworzyć opisu sceny.");
  }
};

// Generate an image based on the generated prompt and aspect ratio
export const generateImageFromPrompt = async (
  prompt: string, 
  aspectRatio: string, 
  seed?: number, 
  retryCount = 0
): Promise<string> => {
  // Always create a new instance right before the call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const strictPrompt = `${prompt}. The lighting must be exclusively continuous linear LED strips. Absolutely no spotlights, no downlights, no light bulbs, and no visible dots. Professional architectural photography style. High-end finish.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: strictPrompt }]
      },
      config: {
        seed: seed,
        imageConfig: {
          aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16",
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Generacja została zablokowana lub odrzucona przez filtry.");
    }

    const candidate = response.candidates[0];
    let imageData = "";

    // Iterate to find image part as per SDK best practices
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData) {
        imageData = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (imageData) return imageData;
    
    const textPart = candidate.content?.parts?.find(p => p.text);
    if (textPart && textPart.text) {
      const lowerText = textPart.text.toLowerCase();
      if (lowerText.includes("cannot") || lowerText.includes("unable") || lowerText.includes("policy") || lowerText.includes("sorry")) {
        throw new Error(`Model odmówił: ${textPart.text.slice(0, 100)}...`);
      }
    }

    throw new Error("Brak danych obrazu w odpowiedzi modelu.");

  } catch (error: any) {
    const isQuotaError = error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED");
    
    if (isQuotaError && retryCount < 2) {
      console.warn(`Osiągnięto limit (429). Ponawiam próbę ${retryCount + 1}/2 za 15 sekund...`);
      await delay(15000);
      return generateImageFromPrompt(prompt, aspectRatio, seed, retryCount + 1);
    }

    if (isQuotaError) {
      throw new Error("Przekroczono limit API (429). Serwer jest przeciążony, spróbuj ponownie za minutę.");
    }

    throw error;
  }
};
