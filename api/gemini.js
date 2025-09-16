export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  try {
    // 1. Đọc file kiến thức (markdown)
    const ragPath = path.join(process.cwd(), "data", "DDI_Rheumatology.md");
    const ragContext = fs.readFileSync(ragPath, "utf8");

    // 2. Ghép context + input người dùng
    const fullPrompt = `
Bạn là bác sĩ chuyên ngành Cơ Xương Khớp. 
Dưới đây là dữ liệu tham chiếu về tương tác thuốc trong Rheumatology:
---
${ragContext}
---
Nhiệm vụ: phân tích đơn thuốc sau để tìm tương tác thuốc, cảnh báo, khuyến cáo.
Đơn thuốc:
${prompt}
    `;

    // 3. Gọi Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
        process.env.GOOGLE_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        }),
      }
    );

    const data = await response.json();

    res
      .status(200)
      .json({ output: data.candidates?.[0]?.content?.parts?.[0]?.text || "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

