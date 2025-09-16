import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export default async function handler(req, res) {
  // ---- Bật CORS ----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    // ---- Đọc file RAG ----
    const ragPath = path.join(process.cwd(), "data", "DDI_Rheumatology.md");
    const ragData = fs.readFileSync(ragPath, "utf-8");

    // ---- Chuẩn bị prompt ----
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Bạn là một trợ lý y khoa.
Sử dụng dữ liệu tương tác thuốc trong rheumatology sau đây để trả lời.
Nếu không tìm thấy thông tin phù hợp, hãy nói "Không có dữ liệu trong tài liệu".

### Dữ liệu RAG:
${ragData}

### Câu hỏi:
${query}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(200).json({ answer: text });
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    res.status(500).json({ error: error.message });
  }
}
