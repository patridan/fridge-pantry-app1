// src/services/aiService.ts

// Usa variabili d'ambiente per la sicurezza
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Definizione di un'interfaccia per TypeScript
export interface Recipe {
  titolo: string;
  difficolta: string;
  tempo: string;
  procedimento: string;
}

/**
 * Funzione interna per chiamare l'API Gemini
 */
async function _callAI(prompt: string): Promise<Recipe> {
  if (!GEMINI_API_KEY) throw new Error("Chiave API mancante nelle variabili d'ambiente.");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Errore nella chiamata API");
  }

  const textResponse = data.candidates[0].content.parts[0].text;
  const cleanJson = textResponse.replace(/```(?:json)?\n?|```/g, "").trim();

  return JSON.parse(cleanJson);
}

/**
 * Funzione pubblica con retry automatico e fallback
 */
export async function getRecipeFromAI(
  ingredients: string[],
  retries = 3,
  delay = 1000
): Promise<Recipe> {
  const prompt = `Agisci come uno chef esperto. Ho questi ingredienti: ${ingredients.join(", ")}. 
Suggeriscimi una ricetta creativa. 
Rispondi ESCLUSIVAMENTE in formato JSON puro.
Schema richiesto:
{
  "titolo": "string",
  "difficolta": "string",
  "tempo": "string",
  "procedimento": "string"
}`;

  try {
    return await _callAI(prompt);
  } catch (error: any) {
    // Retry se modello sovraccarico
    if (retries > 0 && /overload|503/i.test(error.message)) {
      console.warn(`Modello occupato, ritento in ${delay}ms... (${retries} tentativi rimasti)`);
      await new Promise(res => setTimeout(res, delay));
      return getRecipeFromAI(ingredients, retries - 1, delay * 2); // backoff esponenziale
    }

    // Fallback definitivo
    console.error("Errore AI Service:", error);
    return {
      titolo: "Chef in sciopero",
      difficolta: "-",
      tempo: "-",
      procedimento: `Non sono riuscito a cucinare: ${error.message}`,
    };
  }
}
