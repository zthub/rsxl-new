import { GoogleGenAI } from "@google/genai";

// This is a placeholder for future AI integration.
// For example, generating personalized training advice based on progress.

const getAIClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateEncouragement = async (childName: string): Promise<string> => {
    try {
        const ai = getAIClient();
        const model = 'gemini-2.5-flash';
        const prompt = `Give a short, encouraging sentence for a child named ${childName} who just finished an eye exercise.`;
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });
        
        return response.text || "做得好！继续加油！";
    } catch (error) {
        console.error("Failed to generate AI content", error);
        return "真棒！";
    }
}