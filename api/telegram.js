export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const { message } = req.body;
        
        // جلب المتغيرات من فيرسال
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        // فحص سريع إذا كانت المتغيرات ناقصة
        if (!token || !chatId) {
            return res.status(500).json({ success: false, error: "التوكن أو الشات آي دي مش مقروئين من إعدادات فيرسال" });
        }

        const telegramUrl = `https://telegram.org{token}/sendMessage`;

        const response = await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                chat_id: chatId, 
                text: message 
            })
        });

        const data = await response.json();

        if (data.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ success: false, error: data.description });
        }

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
