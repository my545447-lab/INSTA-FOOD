export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      return res.status(500).json({
        success: false,
        error: "TELEGRAM_BOT_TOKEN is missing"
      });
    }

    if (!chatId) {
      return res.status(500).json({
        success: false,
        error: "TELEGRAM_CHAT_ID is missing"
      });
    }

    const { message } = req.body;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown"
        })
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramData.ok) {
      return res.status(500).json({
        success: false,
        telegram: telegramData
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      error: err.message
    });

  }

}