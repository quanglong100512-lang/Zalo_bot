const ZaloBot = require("node-zalo-bot");
const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

// Mở một trang web nhỏ để Render giữ service luôn sống
app.get("/", (req, res) => {
    res.send("Zalo AI Bot is running smoothly!");
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// Khai báo Token và API Key của bạn
const ZALO_BOT_TOKEN = process.env.ZALO_BOT_TOKEN || "1597276055774666669:duLTLbReWOVQEiknEGTuYABeFGcXfAZRkoxyXewjfcruvlEVUXfngeDiXUsgQsQw";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6KlJ36XB9Nwe3s_7X5Pit_M2WNuV69fRBuDXn1S1JuN8A";

// Khởi tạo Gemini AI SDK
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Khởi tạo Zalo Bot
const bot = new ZaloBot(ZALO_BOT_TOKEN, { polling: true });

// Lắng nghe tin nhắn từ người dùng trên Zalo
bot.on("message", async (msg) => {
    try {
        const chatId = msg.sender.id;
        const userText = msg.message.text;

        console.log(`Nhận tin nhắn từ ${chatId}: ${userText}`);

        if (!userText) return;

        // Gọi Google Gemini để lấy câu trả lời thông minh
        const aiResponseText = await getGeminiReply(userText);

        // Gửi kết quả về lại cho người dùng trên Zalo
        bot.sendMessage(chatId, { text: aiResponseText });
        
    } catch (error) {
        console.error("Lỗi xử lý tin nhắn:", error);
    }
});

// Hàm kết nối với Google Gemini API
async function getGeminiReply(prompt) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "Bạn là một trợ lý ảo thân thiện, thông minh và trả lời ngắn gọn, lịch sự trên Zalo.",
            }
        });

        return response.text || "Xin lỗi, hiện tại tôi chưa thể suy nghĩ ra câu trả lời cho câu hỏi này.";
    } catch (error) {
        console.error("Lỗi khi gọi Gemini AI:", error);
        return "Đã xảy ra lỗi khi kết nối với bộ não AI. Vui lòng thử lại sau nhé!";
    }
}
