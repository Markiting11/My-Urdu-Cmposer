
import { GoogleGenAI, Type } from "@google/genai";
import { AppLanguage } from "../types";

const getSystemPrompt = (lang: AppLanguage) => {
  return `You are a professional exam paper composer for Anwar Ali Sehar. Your primary goal is to accurately digitize handwritten exam papers into high-quality professional documents.

STRICT HEADER REQUIREMENTS:
1. IDENTIFY THE INSTITUTION: Look at the very top of the image for the School, College, or University name.
2. FIELD MAPPING: Put the institution name into the 'title' field.
3. INFO EXTRACTION: Extract 'Subject', 'Total Marks', and 'Time Allowed'.

TRANSCRIPTION RULES:
1. VERBATIM TEXT: Transcribe questions exactly. 
2. NO REDUNDANT MARKS: If you find marks (e.g., "(10)", "(2)", "(20)") at the end of a question, place them in the 'marks' field and REMOVE them from the 'text' field.
3. QUESTION NUMBERS: Place numerals in 'number' (e.g., "1").
4. MCQS: Place each option in the 'subQuestions' array WITHOUT the option label (like a, b, c).

Output MUST be a valid JSON object strictly following the provided schema.`;
};

const EXAM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'The School/Institution name' },
    subject: { type: Type.STRING, description: 'The subject name' },
    totalMarks: { type: Type.STRING, description: 'Total marks value' },
    timeAllowed: { type: Type.STRING, description: 'Time duration allowed' },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Section title' },
          instructions: { type: Type.STRING, description: 'Specific instructions' },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.STRING, description: 'The question number' },
                text: { type: Type.STRING, description: 'The actual question text' },
                marks: { type: Type.STRING, description: 'Marks' },
                subQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['number', 'text']
            }
          }
        },
        required: ['title', 'questions']
      }
    }
  },
  required: ['title', 'subject', 'sections']
};

export const processHandwrittenImage = async (base64Images: string[], lang: AppLanguage): Promise<any> => {
  // Use either the environment key (Netlify) or the session key (AI Studio)
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("API_KEY_NOT_FOUND");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const parts = base64Images.map(img => ({
      inlineData: {
        data: img.split(',')[1],
        mimeType: 'image/jpeg'
      }
    }));

    const promptText = lang === 'UR' 
      ? "انور علی سہڑ کی خصوصی ہدایت: سوالات کی درست اردو کمپوزنگ کریں۔"
      : "Per instructions from Anwar Ali Sehar: Strip trailing bracketed marks from the 'text' field and move them to 'marks' only.";

    parts.push({ text: promptText } as any);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: parts as any },
      config: {
        systemInstruction: getSystemPrompt(lang),
        responseMimeType: "application/json",
        responseSchema: EXAM_SCHEMA as any,
      }
    });

    if (!response.text) throw new Error("No content generated");

    const data = JSON.parse(response.text);
    return { ...data, language: lang };
  } catch (error: any) {
    // Catch-all for API errors that indicate key issues
    if (
      error.message?.includes("API key") || 
      error.message?.includes("403") || 
      error.message?.includes("404") ||
      error.message?.includes("Requested entity was not found")
    ) {
      throw new Error("API_KEY_NOT_FOUND");
    }
    console.error("Gemini Error:", error);
    throw error;
  }
};