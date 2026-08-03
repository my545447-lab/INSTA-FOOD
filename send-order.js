export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            error: "Method not allowed"
        });
    }

    const { to, body } = req.body;

    try {

        const response = await fetch(
            "https://api.ultramsg.com/instance186689/messages/chat",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    token: "ضع_التوكن_الجديد_هنا",
                    to,
                    body
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({
                success: false,
                error: data
            });
        }

        res.status(200).json({
            success: true,
            data
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

}