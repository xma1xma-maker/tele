export default async function handler(req, res) {
    // تأكد أن الطلب قادم من تيليجرام
    if (req.method === 'POST') {
        const update = req.body;

        // التحقق من وجود رسالة نصية
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const firstName = update.message.from.first_name || "صديقي";

            // إذا كانت الرسالة هي /start
            if (text.startsWith('/start')) {
                
                // ==========================================
                // ⚠️ ضع توكن البوت الخاص بك هنا بين علامتي التنصيص
                const BOT_TOKEN = "8134465481:AAHNzgwl66xvdIuIXb_IgOEvHJ-1ysRj81w"; 
                // ==========================================

                const messageText = `أهلاً بك يا ${firstName} في *CryptSon*! 🚀\n\nلقد حصلت للتو على *طائر برونزي مجاني* ورصيد ترحيبي لتبدأ رحلتك معنا. 🎁\nطيورك تعمل الآن وتجمع لك الأرباح حتى وأنت نائم!\n\n🎮 *كيف تبدأ؟*\n1️⃣ افتح التطبيق من الزر بالأسفل.\n2️⃣ اجمع أرباحك كل ساعة.\n3️⃣ أكمل المهمات وشاهد الإعلانات لزيادة رصيدك.\n4️⃣ اسحب أرباحك عند الوصول للحد الأدنى!\n\n👇 *اضغط على الزر أدناه لفتح اللعبة الآن!*`;

                // إعداد زر فتح اللعبة
                const replyMarkup = {
                    inline_keyboard: [
                        [{ text: "🎮 افتح اللعبة الآن", url: "https://t.me/ddjdifjbot/tofe" }]
                    ]
                };

                // إرسال الرد إلى تيليجرام
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
    
    // إخبار Vercel وتيليجرام أن كل شيء تمام
    res.status(200).send('OK');
}
