// File: /api/check-interactions.js

// Cần cài đặt gói này: npm install @google/generative-ai
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Lấy API Key từ biến môi trường (cách an toàn)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Nội dung RAG từ ghi chú của bạn
const ragContext = `
--- BẮT ĐẦU KIẾN THỨC NỀN ---
NSAIDs + Corticosteroid: Tăng nguy cơ loét, xuất huyết tiêu hoá. Mức độ Nặng. Khuyến cáo: Tránh phối hợp; nếu bắt buộc, dùng PPI dự phòng.
NSAIDs + Thuốc chống đông (Warfarin, DOACs): Tăng nguy cơ chảy máu. Mức độ Nặng.
NSAIDs + ACEi/ARB + Lợi tiểu: “Triple whammy” → suy thận cấp. Mức độ Nặng.
Corticosteroid + Quinolon: Tăng nguy cơ đứt gân. Mức độ Nặng.
MTX + Cotrimoxazole (TMP-SMX): Tăng độc tính MTX (suy tuỷ). Mức độ Nặng.
Allopurinol + Azathioprine / 6-MP: Tăng độc tính AZA/6-MP (suy tuỷ). Mức độ Nặng.
Colchicine + Clarithromycin: Tăng nồng độ colchicine (tiêu cơ vân, suy tuỷ). Mức độ Nặng.
Opioids + Benzodiazepine: Suy hô hấp. Mức độ Nặng.
Tramadol + SSRI / SNRI: Nguy cơ hội chứng serotonin. Mức độ Nặng.
--- KẾT THÚC KIẾN THỨC NỀN ---
`;

export default async function handler(req, res) {
    // Chỉ cho phép phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prescription } = req.body;
        if (!prescription) {
            return res.status(400).json({ error: 'Không có đơn thuốc nào được cung cấp.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Bạn là một dược sĩ lâm sàng AI chuyên về tương tác thuốc.
            Dựa vào KIẾN THỨC NỀN được cung cấp và kiến thức chung của bạn, hãy phân tích đơn thuốc sau đây.

            ${ragContext}

            Đơn thuốc cần phân tích:
            """
            ${prescription}
            """

            Yêu cầu:
            1. Liệt kê tất cả các loại thuốc có trong đơn (chỉ tên thuốc).
            2. Xác định các cặp thuốc có tương tác tiềm ẩn dựa trên KIẾN THỨC NỀN và kiến thức của bạn.
            3. Với mỗi cặp tương tác, hãy mô tả ngắn gọn nguy cơ, mức độ (Nặng, Trung bình, Nhẹ), và đưa ra khuyến cáo.
            4. Nếu không tìm thấy tương tác nào, hãy ghi rõ "Không phát hiện tương tác thuốc đáng kể trong đơn này."
            5. Trình bày kết quả dưới dạng markdown, rõ ràng, dễ đọc.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Trả kết quả về cho frontend
        res.status(200).json({ analysis: text });

    } catch (error) {
        console.error('Lỗi khi gọi Gemini API:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi phân tích đơn thuốc.' });
    }
}