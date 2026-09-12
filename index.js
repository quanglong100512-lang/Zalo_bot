const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Token và API Key của bạn
const ZALO_BOT_TOKEN = process.env.ZALO_BOT_TOKEN || "1597276055774666669:duLTLbReWOVQEiknEGTuYABeFGcXfAZRkoxyXewjfcruvlEVUXfngeDiXUsgQsQw";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6KlJ36XB9Nwe3s_7X5Pit_M2WNuV69fRBuDXn1S1JuN8A";

// Khởi tạo Gemini AI
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Trang chủ kiểm tra trạng thái sống
app.get("/", (req, res) => {
    res.send("Zalo AI Bot is running and ready for webhooks!");
});

// Nhận Webhook từ Zalo Bot Manager / Zalo OA gửi đến
app.post("/webhook", async (req, res) => {
    try {
        const data = req.body;
        console.log("Nhận dữ liệu từ Zalo:", JSON.stringify(data));

        // Kiểm tra nếu là sự kiện người dùng gửi tin nhắn văn bản
        if (data.event_name === "user_send_text" || (data.message && data.message.text)) {
            const senderId = data.sender.id;
            const userText = data.message.text;

            console.log(`Tin nhắn từ ${senderId}: ${userText}`);

            // Gọi Gemini AI để lấy câu trả lời
            const aiReplyText = await getGeminiReply(userText);

            // Gửi phản hồi lại cho người dùng qua Zalo OpenAPI
            await sendZaloMessage(senderId, aiReplyText);
        }

        res.status(200).json({ status: "success" });
    } catch (error) {
        console.error("Lỗi xử lý webhook:", error);
        res.status(500).json({ status: "error" });
    }
});

// Hàm gọi Google Gemini API
async function getGeminiReply(prompt) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "Bạn là một trợ lý ảo thông minh, thân thiện trên Zalo. Hãy trả lời ngắn gọn, súc tích.",
            }
        });
        return response.text || "Xin lỗi, tôi chưa nghĩ ra câu trả lời.";
    } catch (error) {
        console.error("Lỗi Gemini API:", error);
        return "Hiện tại bộ não AI đang bận, bạn thử lại sau nhé!";
    }
}

// Hàm gửi tin nhắn qua Zalo OA API
async function sendZaloMessage(recipientId, textMessage) {
    const url = "https://openapi.zalo.me/v2.0/oa/message";
    
    const payload = {
        recipient: { user_id: recipientId },
        message: { text: textMessage }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "access_token": ZALO_BOT_TOKEN
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Kết quả gửi Zalo:", result);
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn Zalo:", error);
    }
}

app.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
});
