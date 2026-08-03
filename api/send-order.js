export default async function handler(req, res) {
    // السماح فقط باستقبال طلبات POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const orderData = req.body;
        
        // جلب التوكن والآي دي بأمان من سيرفر فيرسال
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        // تنسيق نص الرسالة
        const message = `
📦 *طلب جديد من الموقع!*

👤 *العميل:* ${orderData.name || "غير مسجل"}
📞 *الهاتف:* ${orderData.phone || "غير مسجل"}
📍 *العنوان:* ${orderData.address || "غير مسجل"}
💰 *الإجمالي:* ${orderData.total || "0"} ج.م

🛒 *المنتجات:*
${orderData.items || "لا توجد منتجات"}
        `.trim();

        const telegramUrl = `https://telegram.org{8700661165:AAGWEmhEhH1fvjRSICUQ_hWbHNyD6PZ7RNg}/sendMessage`;

        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await response.json();

        if (result.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ success: false, error: result.description });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
