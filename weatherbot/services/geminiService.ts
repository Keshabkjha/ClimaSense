
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

/**
 * Enterprise Fallback Strategy:
 * 1. Pro (Primary Reasoning)
 * 2. Flash (Speed/Cost Efficiency)
 * 3. Stable Fallbacks (Reliability)
 */
const FALLBACK_MODELS = [
  'gemini-3-pro-preview',            // Primary: High-intelligence for weather reasoning
  'gemini-3-flash-preview',           // Secondary: Ultra-fast
  'gemini-flash-latest',             // Tertiary: Stable production
  'gemini-flash-lite-latest',        // Quaternary: Lightweight
  'gemini-2.5-flash-preview-09-2025' // Final legacy cluster
];

export type TemperatureUnit = 'Celsius' | 'Fahrenheit';

export class GeminiWeatherService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async queryWeather(prompt: string, location?: { lat: number; lng: number }, unit: TemperatureUnit = 'Celsius') {
    let lastError: any = null;

    for (const modelName of FALLBACK_MODELS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const locationContext = location 
            ? `Current GPS: ${location.lat}, ${location.lng}. Use this for "local" or "here" queries.`
            : "No location data. Ask for city if needed.";

          const response = await this.ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: `You are SkyScope AI, a world-class weather intelligence system. 
              ${locationContext}
              Provide professional weather intelligence. 
              - IMPORTANT: Use ${unit} for all temperature values.
              - SAFETY FIRST: Prioritize severe weather alerts.
              - Use Markdown for bolding and lists.
              - Always check Google Search for live data.
              
              STRUCTURED DATA INSTRUCTIONS:
              1. If the user asks for a forecast, a 7-day outlook, or "next week", include a JSON block at the end of your response like this:
              \`\`\`json
              {
                "forecast": [
                  {"day": "Mon", "high": 22, "low": 15, "condition": "Sunny", "rainChance": "5%", "icon": "sun"},
                  ... (7 days total)
                ]
              }
              \`\`\`
              Icons allowed: 'sun', 'cloud', 'rain', 'storm', 'snow', 'wind', 'cloud-sun'.

              2. If providing current hourly trends or temperature progression, include a JSON block:
              \`\`\`json
              {
                "chartData": [
                  {"time": "9AM", "temp": 18},
                  {"time": "12PM", "temp": 22},
                  ...
                ]
              }
              \`\`\`

              Keep conversational text concise. The JSON will be rendered as high-end UI widgets.`,
              tools: [{ googleSearch: {} }]
            }
          });

          const text = response.text || "I couldn't process that weather request.";
          const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          
          return {
            text,
            sources: sources.filter(c => c.web).map(c => ({ title: c.web.title, uri: c.web.uri })),
            modelUsed: modelName
          };
        } catch (error: any) {
          lastError = error;
          if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) break;
          if (attempt < 2) await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }
    throw lastError || new Error("Service Unavailable");
  }
}

export const weatherService = new GeminiWeatherService();
