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
    const { prescription, query } = req.body;
    const input = prescription || query;  // 👉 chấp nhận cả hai field
    if (!input) {
      return res.status(400).json({ error: "Missing input (prescription or query)" });
    }

    // ---- Đọc file RAG ----
    const ragPath = path.join(process.cwd(), "data", "DDI_Rheumatology.md");
    const ragData = fs.readFileSync(ragPath, "utf-8");

    // ---- Chuẩn bị prompt ----
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Bạn là một trợ lý y khoa.
Sử dụng dữ liệu tương tác thuốc sau để phân tích đơn thuốc.
Nếu không tìm thấy thông tin phù hợp, hãy nói "Không có dữ liệu trong tài liệu".

### Dữ liệu RAG:
${ragData}

### Đơn thuốc bệnh nhân:
${input}

### Nhiệm vụ:
- Liệt kê các tương tác thuốc có thể xảy ra.
- Ghi rõ mức độ (🚨 Nặng / 🚦 Trung bình).
- Đưa khuyến cáo ngắn gọn.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(200).json({ analysis: text });
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    res.status(500).json({ error: error.message });
  }
}
