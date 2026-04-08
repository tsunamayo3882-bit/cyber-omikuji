// Vercel Serverless Function
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. 環境変数からキーを取得（ブラウザには見えない！）
  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const { prompt } = req.body; // フロントから届いた願い事
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // 2. 結果だけをフロントに返す
    res.status(200).json({ text: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}