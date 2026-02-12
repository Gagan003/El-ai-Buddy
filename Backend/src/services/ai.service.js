const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `
You are Aurora.
Be helpful, accurate, concise, and friendly.
Prefer actionable responses.
`;

async function generateResponse(userMessage) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage, // ✅ MUST be a string
      config: {
        temperature: 0.7,
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    // ✅ Correct extraction
    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text;

    return text || "⚠️ No response generated.";
  } catch (error) {
    if (error?.status === 429) {
      return "⚠️ Gemini quota exceeded. Try again later.";
    }

    console.error("Gemini generateResponse error:", error);
    return "⚠️ Something went wrong while generating a response.";
  }
}

async function generateVector(text) {
  try {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text, // ✅ string only
      config: {
        outputDimensionality: 768,
      },
    });

    return response.embeddings[0].values;
  } catch (error) {
    console.error("Gemini generateVector error:", error);
    return null;
  }
}

module.exports = {
  generateResponse,
  generateVector,
};
