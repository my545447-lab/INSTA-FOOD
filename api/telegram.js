export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ success: false });
    }

    try {

        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        const { message } = req.body;

        const response = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                })
            }
        );

        const data = await response.json();

        if (!data.ok) {
            return res.status(500).json({
         success: false,
         telegram: data
          });
        }

        return res.status(200).json({
            success: true
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message,
            stack: err.stack
        });
    }
}