export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        const { message } = req.body;

        if (!token || !chatId) {
            return res.status(500).json({ success: false, error: "Environment variables are missing" });
        }

        const telegramUrl = `https://telegram.org{token}/sendMessage`;

        // أرسلنا البيانات هنا كنص عادي بدون Markdown لضمان عدم حدوث خطأ 500 بسبب الرموز والأرقام العربية
        const response = await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                chat_id: chatId, 
                text: message
            })
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            return res.status(500).json({ success: false, telegram: data, error: data.description || "Telegram API Error" });
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
