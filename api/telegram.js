export const config = {
    runtime: 'edge', // تشغيل الملف بأعلى سرعة وتوافق مع دوال الاتصال الخارجية
};

export default async function handler(request) {
    // السماح فقط بطلبات POST
    if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        // جلب نص الرسالة المرسلة من المتصفح
        const { message } = await request.json();
        
        // جلب متغيرات البيئة السرية المضافة في فيرسال
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            return new Response(JSON.stringify({ success: false, error: "Environment variables are missing" }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }

        const telegramUrl = `https://telegram.org{token}/sendMessage`;

        // تنفيذ طلب الإرسال إلى تليجرام مع ضبط التوقيت والأمان
        const telegramResponse = await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                chat_id: chatId, 
                text: message
            })
        });

        const data = await telegramResponse.json();

        if (!telegramResponse.ok || !data.ok) {
            return new Response(JSON.stringify({ success: false, error: data.description || "Telegram API Error" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
