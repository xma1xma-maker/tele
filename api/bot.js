export default async function handler(req, res) {
    if (req.method === 'POST') {
        const update = req.body;

        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const firstName = update.message.from.first_name || "صديقي";

            if (text.startsWith('/start')) {
                
                // ==========================================
                // هنا سيقوم الكود بسحب التوكن من إعدادات Vercel سرياً
                const BOT_TOKEN = process.env.BOT_TOKEN; 
                // ==========================================

                if (!BOT_TOKEN) {
                    console.error("لم يتم العثور على التوكن في Vercel!");
                    return res.status(500).send('Error');
                }

                const messageText = `أهلاً بك يا ${firstName} في *CryptSon*! 🚀\n\nلقد حصلت للتو على *طائر برونزي مجاني* ورصيد ترحيبي لتبدأ رحلتك معنا. 🎁\nطيورك تعمل الآن وتجمع لك الأرباح حتى وأنت نائم!\n\n🎮 *كيف تبدأ؟*\n1️⃣ افتح التطبيق من الزر بالأسفل.\n2️⃣ اجمع أرباحك كل ساعة.\n3️⃣ أكمل المهمات وشاهد الإعلانات لزيادة رصيدك.\n4️⃣ اسحب أرباحك عند الوصول للحد الأدنى!\n\n👇 *اضغط على الزر أدناه لفتح اللعبة الآن!*`;

                const replyMarkup = {
                    inline_keyboard: [
                        [{ text: "🎮 افتح اللعبة الآن", url: "https://t.me/ddjdifjbot/tofe" }]
                    ]
                };

                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: messageText,
                        parse_mode: 'Markdown',
                        reply_markup: replyMarkup
                    } )
                });
            }
        }
    }
    res.status(200).send('OK');
}
