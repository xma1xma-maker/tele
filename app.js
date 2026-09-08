// تهيئة Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// تهيئة Supabase
const supabaseUrl = 'https://kqhopvodwxvvvxiqjcyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxaG9wdm9kd3h2dnZ4aXFqY3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NzM1MjAsImV4cCI6MjEwNDQ0OTUyMH0.X7s4t1afpbHHd4u-jziupItmAjXC8VBarfUljxmd9dk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey );

// بيانات المستخدم من تيليجرام
const tgUser = tg.initDataUnsafe?.user;
const telegramUserId = tgUser ? tgUser.id : Math.floor(Math.random() * 1000000); // رقم عشوائي للتجربة خارج تيليجرام
const userName = tgUser ? tgUser.first_name : "مستخدم تجريبي";
const userPhoto = tgUser && tgUser.photo_url ? tgUser.photo_url : null;
const startParam = tg.initDataUnsafe?.start_param; // لجلب كود الإحالة (مثال: ref_12345)

// عنوان محفظتك للإيداع (قم بتغييره إلى عنوانك الحقيقي)
const ADMIN_WALLET_ADDRESS = "UQDO_YOUR_TON_WALLET_ADDRESS_HERE";

// إدارة حالة المستخدم
let userState = {
    balance: 0.00,
    unclaimed: 0.000000,
    hourlyRate: 0.00,
    referrals: 0,
    refEarnings: 0.00,
    lastCollectTime: 0,
    inventory: []
};

let tasks = []; // سيتم جلبها من قاعدة البيانات

// كتالوج المتجر
const shopCatalog = [
    { id: 1, name: "الطائر البرونزي", price: 0.10, monthIncome: 0.30, dailyPercent: 10, image: "https://cdn-icons-png.flaticon.com/512/2585/2585188.png" },
    { id: 2, name: "الطائر الناري", price: 3.00, monthIncome: 10.80, dailyPercent: 12, image: "https://cdn-icons-png.flaticon.com/512/2585/2585177.png" },
    { id: 3, name: "الطائر الفضي", price: 15.00, monthIncome: 63.00, dailyPercent: 14, image: "https://cdn-icons-png.flaticon.com/512/2585/2585197.png" },
    { id: 4, name: "الطائر الذهبي", price: 50.00, monthIncome: 240.00, dailyPercent: 16, image: "https://cdn-icons-png.flaticon.com/512/2585/2585202.png" },
    { id: 5, name: "الكاسر الآلي", price: 100.00, monthIncome: 720.00, dailyPercent: 24, image: "https://cdn-icons-png.flaticon.com/512/2585/2585215.png" }
];

// تهيئة التطبيق
window.addEventListener('DOMContentLoaded', async ( ) => {
    setupUserProfile();
    injectDepositUI();
    await loadUserData();
    await loadTasks();
    
    renderActiveBirds();
    renderShop();
    updateUI();

    // تحديث الأرباح الحية
    setInterval(() => {
        if (userState.hourlyRate > 0) {
            const perSecond = (userState.hourlyRate / 3600);
            userState.unclaimed += perSecond / 10;
            document.getElementById('unclaimed-balance').innerText = userState.unclaimed.toFixed(6);
        }
    }, 100);
});

// إعداد صورة واسم المستخدم
function setupUserProfile() {
    document.getElementById('user-name').innerText = userName;
    const avatarContainer = document.querySelector('.fa-user-astronaut').parentElement;
    if (userPhoto) {
        avatarContainer.innerHTML = `<img src="${userPhoto}" class="w-full h-full rounded-full object-cover">`;
    }
    // إعداد رابط الإحالة
    document.getElementById('ref-link-text').innerText = `https://t.me/CryptSonBot?start=ref_${telegramUserId}`;
}

// جلب بيانات المستخدم من Supabase
async function loadUserData( ) {
    const { data, error } = await supabase.from('users').select('*').eq('id', telegramUserId).single();

    if (data) {
        userState.balance = data.balance || 0;
        userState.hourlyRate = data.hourly_rate || 0;
        userState.lastCollectTime = data.last_collect_time || Date.now();
        userState.referrals = data.referrals_count || 0;
        userState.refEarnings = data.ref_earnings || 0;
        userState.inventory = data.inventory || [];
        
        // حساب الأرباح المتراكمة منذ آخر دخول
        const now = Date.now();
        const hoursPassed = (now - userState.lastCollectTime) / (1000 * 60 * 60);
        if (hoursPassed > 0 && userState.hourlyRate > 0) {
            userState.unclaimed += (hoursPassed * userState.hourlyRate);
        }
    } else {
        // مستخدم جديد
        await registerNewUser();
    }
}

// تسجيل مستخدم جديد ومعالجة الإحالة
async function registerNewUser() {
    let referredBy = null;
    
    // التحقق مما إذا كان قد دخل عبر رابط إحالة
    if (startParam && startParam.startsWith('ref_')) {
        referredBy = parseInt(startParam.split('_')[1]);
        if (referredBy !== telegramUserId) {
            // إضافة مكافأة للداعي
            const { data: referrer } = await supabase.from('users').select('referrals_count, ref_earnings, balance').eq('id', referredBy).single();
            if (referrer) {
                await supabase.from('users').update({
                    referrals_count: referrer.referrals_count + 1,
                    ref_earnings: referrer.ref_earnings + 0.10,
                    balance: referrer.balance + 0.10
                }).eq('id', referredBy);
            }
        }
    }

    // إنشاء الحساب
    const newUser = {
        id: telegramUserId,
        name: userName,
        balance: 0.05, // هدية ترحيبية
        hourly_rate: 0,
        last_collect_time: Date.now(),
        referrals_count: 0,
        ref_earnings: 0,
        inventory: [],
        referred_by: referredBy
    };

    await supabase.from('users').insert([newUser]);
    userState.balance = 0.05;
    userState.lastCollectTime = Date.now();
}

// حفظ بيانات المستخدم
async function saveUserData() {
    await supabase.from('users').update({
        balance: userState.balance,
        hourly_rate: userState.hourlyRate,
        last_collect_time: userState.lastCollectTime,
        inventory: userState.inventory
    }).eq('id', telegramUserId);
}

// جلب المهمات من Supabase
async function loadTasks() {
    const { data, error } = await supabase.from('tasks').select('*').eq('is_active', true);
    if (data) {
        tasks = data;
        renderTasks();
    }
}

// تحديث الواجهة
function updateUI() {
    document.getElementById('user-balance').innerText = userState.balance.toFixed(2);
    document.getElementById('hourly-rate-badge').innerText = `+$${userState.hourlyRate.toFixed(2)} / ساعة`;
    document.getElementById('stat-hour').innerText = `$${(userState.hourlyRate).toFixed(2)}`;
    document.getElementById('stat-day').innerText = `$${(userState.hourlyRate * 24).toFixed(2)}`;
    document.getElementById('stat-month').innerText = `$${(userState.hourlyRate * 24 * 30).toFixed(2)}`;
    document.getElementById('ref-count').innerText = userState.referrals;
    document.getElementById('ref-earnings').innerText = `$${userState.refEarnings.toFixed(2)}`;
}

// التبديل بين النوافذ
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'text-amber-800', 'bg-amber-200/60');
        btn.classList.add('text-amber-700/60');
    });
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`nav-${tabName}`);
    activeBtn.classList.add('active', 'text-amber-800', 'bg-amber-200/60');
    activeBtn.classList.remove('text-amber-700/60');
}

// جمع الأرباح (كل ساعة)
function collectEarnings() {
    const now = Date.now();
    const cooldown = 60 * 60 * 1000; // ساعة واحدة

    if (userState.lastCollectTime !== 0 && (now - userState.lastCollectTime) < cooldown) {
        const minutesLeft = Math.ceil((cooldown - (now - userState.lastCollectTime)) / (60 * 1000));
        showToast(`انتظر ${minutesLeft} دقيقة للجمع مرة أخرى!`, "fa-clock", "text-amber-400");
        return;
    }

    if (userState.unclaimed <= 0.00001) {
        showToast("لا توجد أرباح كافية للجمع!", "fa-circle-exclamation", "text-amber-400");
        return;
    }

    userState.balance += userState.unclaimed;
    userState.unclaimed = 0;
    userState.lastCollectTime = now;
    
    updateUI();
    saveUserData();
    showToast("تم جمع الأرباح بنجاح!", "fa-circle-check", "text-green-400");
}

// عرض الطيور
function renderActiveBirds() {
    const container = document.getElementById('active-birds-grid');
    container.innerHTML = '';
    userState.inventory.forEach(item => {
        for (let i = 0; i < item.count; i++) {
            container.innerHTML += `
                <div class="vintage-border bg-card-bg p-2 rounded-xl text-center flex flex-col items-center justify-center shadow-sm">
                    <img src="${item.image}" class="w-10 h-10 object-contain mb-1 drop-shadow">
                    <div class="text-[10px] font-bold text-amber-950">${item.name}</div>
                    <div class="text-[9px] text-green-700 font-bold">+${item.dailyPercent}% يومياً</div>
                </div>`;
        }
    });
}

// عرض المتجر
function renderShop() {
    const container = document.getElementById('shop-items-list');
    container.innerHTML = '';
    shopCatalog.forEach(item => {
        container.innerHTML += `
            <div class="vintage-border bg-card-bg p-3 rounded-2xl text-center flex flex-col justify-between">
                <div>
                    <div class="text-[10px] text-amber-800 font-bold mb-1">دخل $${item.monthIncome.toFixed(2)} / شهرياً</div>
                    <img src="${item.image}" class="w-16 h-16 mx-auto object-contain my-2">
                    <div class="font-bold text-xs text-amber-950">${item.name}</div>
                </div>
                <button onclick="buyBird(${item.id})" class="mt-2 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl active:scale-95 transition-transform">
                    <i class="fa-solid fa-cart-shopping"></i> شراء $${item.price.toFixed(2)}
                </button>
            </div>`;
    });
}

// شراء طائر
function buyBird(id) {
    const item = shopCatalog.find(x => x.id === id);
    if (userState.balance < item.price) {
        showToast("رصيدك غير كافٍ! قم بعمل إيداع أولاً.", "fa-circle-xmark", "text-red-400");
        document.getElementById('deposit-modal').classList.remove('hidden'); // إظهار نافذة الإيداع
        return;
    }

    userState.balance -= item.price;
    userState.hourlyRate += (item.price * (item.dailyPercent / 100)) / 24;

    const existing = userState.inventory.find(x => x.id === id);
    if (existing) existing.count++;
    else userState.inventory.push({ id: item.id, name: item.name, image: item.image, dailyPercent: item.dailyPercent, count: 1 });

    renderActiveBirds();
    updateUI();
    saveUserData();
    showToast(`تم شراء ${item.name} بنجاح!`, "fa-circle-check", "text-green-400");
}

// عرض المهمات
function renderTasks() {
    const container = document.getElementById('tasks-list');
    container.innerHTML = '';
    tasks.forEach(t => {
        container.innerHTML += `
            <div class="vintage-border bg-card-bg p-3 rounded-2xl flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-sm">
                        <i class="fa-brands fa-telegram"></i>
                    </div>
                    <div>
                        <div class="font-bold text-xs text-amber-950">${t.title}</div>
                        <div class="text-[10px] text-green-700 font-bold">+ $${t.reward.toFixed(2)}</div>
                    </div>
                </div>
                <button onclick="doTask(${t.id}, '${t.link}', ${t.reward})" class="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow active:scale-95">تنفيذ</button>
            </div>`;
    });
}

// تنفيذ المهمة
function doTask(id, link, reward) {
    window.open(link, '_blank');
    setTimeout(() => {
        userState.balance += reward;
        updateUI();
        saveUserData();
        showToast(`تمت إضافة مكافأة المهمة $${reward}!`, "fa-circle-check", "text-green-400");
    }, 5000);
}

// نسخ الرابط
function copyRefLink() {
    navigator.clipboard.writeText(document.getElementById('ref-link-text').innerText);
    showToast("تم نسخ الرابط!", "fa-copy", "text-blue-400");
}

// طلب السحب (مع شرط 20 إحالة)
async function processWithdrawal() {
    const method = document.getElementById('withdraw-method').value;
    const address = document.getElementById('withdraw-address').value.trim();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);

    if (userState.referrals < 20) {
        showToast("عذراً! يجب أن تدعو 20 شخصاً على الأقل لتتمكن من السحب.", "fa-circle-xmark", "text-red-500");
        return;
    }
    if (!address || isNaN(amount) || amount < 0.50 || amount > userState.balance) {
        showToast("تأكد من البيانات والرصيد (الحد الأدنى $0.50)", "fa-circle-exclamation", "text-amber-400");
        return;
    }

    userState.balance -= amount;
    updateUI();
    saveUserData();

    // إرسال الطلب إلى Supabase
    await supabase.from('withdrawals').insert([{
        user_id: telegramUserId,
        method: method,
        address: address,
        amount: amount,
        status: 'pending'
    }]);

    document.getElementById('withdraw-address').value = '';
    document.getElementById('withdraw-amount').value = '';
    showToast("تم إرسال طلب السحب للمراجعة!", "fa-circle-check", "text-green-400");
}

// --- نظام الإيداع (شحن الرصيد) ---
function injectDepositUI() {
    // إضافة زر الإيداع في قسم المحفظة
    const walletSection = document.getElementById('tab-wallet');
    const depositBtn = document.createElement('button');
    depositBtn.className = "w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow active:scale-95 mb-4 flex items-center justify-center gap-2";
    depositBtn.innerHTML = `<i class="fa-solid fa-download"></i> إيداع رصيد لشراء الطيور`;
    depositBtn.onclick = () => document.getElementById('deposit-modal').classList.remove('hidden');
    walletSection.insertBefore(depositBtn, walletSection.firstChild);

    // إنشاء نافذة الإيداع المنبثقة
    const modalHTML = `
    <div id="deposit-modal" class="fixed inset-0 bg-black/80 z-50 hidden flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-card-bg p-5 rounded-2xl w-full max-w-sm border-2 border-amber-300">
            <h3 class="font-black text-amber-900 text-lg mb-2">إيداع رصيد</h3>
            <p class="text-xs text-amber-800 mb-4">قم بتحويل المبلغ (USDT أو TON) إلى المحفظة التالية، ثم أدخل رقم العملية (TxID) للتحقق.</p>
            
            <div class="bg-amber-100 p-3 rounded-xl border border-amber-300 mb-4 text-center">
                <div class="text-[10px] font-bold text-amber-700 mb-1">عنوان المحفظة:</div>
                <div class="text-xs font-mono font-black text-gray-800 break-all select-all">${ADMIN_WALLET_ADDRESS}</div>
            </div>

            <input type="text" id="deposit-txid" placeholder="أدخل رقم العملية (TxID / Hash)..." class="w-full p-3 rounded-xl border border-amber-300 mb-3 text-xs font-bold focus:outline-none">
            <input type="number" id="deposit-amount" placeholder="المبلغ الذي أرسلته ($)" class="w-full p-3 rounded-xl border border-amber-300 mb-4 text-xs font-bold focus:outline-none">

            <div class="flex gap-2">
                <button onclick="submitDeposit()" class="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-sm">تأكيد الإيداع</button>
                <button onclick="document.getElementById('deposit-modal').classList.add('hidden')" class="flex-1 bg-gray-400 text-white py-2 rounded-xl font-bold text-sm">إلغاء</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function submitDeposit() {
    const txid = document.getElementById('deposit-txid').value.trim();
    const amount = parseFloat(document.getElementById('deposit-amount').value);

    if (!txid || isNaN(amount) || amount <= 0) {
        showToast("يرجى إدخال رقم العملية والمبلغ بشكل صحيح!", "fa-circle-xmark", "text-red-400");
        return;
    }

    // إرسال طلب الإيداع إلى Supabase
    await supabase.from('deposits').insert([{
        user_id: telegramUserId,
        tx_hash: txid,
        amount: amount,
        status: 'pending'
    }]);

    document.getElementById('deposit-modal').classList.add('hidden');
    document.getElementById('deposit-txid').value = '';
    document.getElementById('deposit-amount').value = '';
    showToast("تم إرسال طلب الإيداع! سيتم إضافة الرصيد بعد المراجعة.", "fa-clock", "text-blue-400");
}

// إشعارات
function showToast(message, iconClass = "fa-circle-check", iconColor = "text-green-400") {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = message;
    document.getElementById('toast-icon').className = `fa-solid ${iconClass} ${iconColor}`;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none');
        toast.classList.remove('opacity-100');
    }, 3000);
}
