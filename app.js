// تهيئة Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand(); // توسيع التطبيق ليملأ الشاشة

// جلب بيانات المستخدم من تيليجرام (إذا كان متاحاً)
const tgUser = tg.initDataUnsafe?.user;
if (tgUser) {
    document.getElementById('user-name').innerText = tgUser.first_name;
}

// إعدادات Supabase (سنقوم بتفعيلها لاحقاً بعد إنشاء حساب Supabase)
/*
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);
*/

// إدارة حالة المستخدم (State Management)
let userState = {
    balance: 0.05, // رصيد البداية
    unclaimed: 0.000000,
    hourlyRate: 0.10, // $0.10 في الساعة
    referrals: 0,
    refEarnings: 0.00,
    dailyClaimed: false,
    inventory: [
        { id: 1, name: "الطائر البرونزي", image: "https://cdn-icons-png.flaticon.com/512/2585/2585188.png", dailyPercent: 10, count: 1 }
    ]
};

// كتالوج المتجر (Shop Catalog )
const shopCatalog = [
    { id: 1, name: "الطائر البرونزي", price: 0.10, monthIncome: 0.30, dailyPercent: 10, image: "https://cdn-icons-png.flaticon.com/512/2585/2585188.png" },
    { id: 2, name: "الطائر الناري", price: 3.00, monthIncome: 10.80, dailyPercent: 12, image: "https://cdn-icons-png.flaticon.com/512/2585/2585177.png" },
    { id: 3, name: "الطائر الفضي", price: 15.00, monthIncome: 63.00, dailyPercent: 14, image: "https://cdn-icons-png.flaticon.com/512/2585/2585197.png" },
    { id: 4, name: "الطائر الذهبي", price: 50.00, monthIncome: 240.00, dailyPercent: 16, image: "https://cdn-icons-png.flaticon.com/512/2585/2585202.png" },
    { id: 5, name: "الكاسر الآلي", price: 100.00, monthIncome: 720.00, dailyPercent: 24, image: "https://cdn-icons-png.flaticon.com/512/2585/2585215.png" }
];

// قائمة المهمات (Tasks List )
let tasks = [
    { id: 101, title: "الاشتراك في قناة التليجرام الرسمية", reward: 0.08, link: "https://t.me/telegram", completed: false, checking: false },
    { id: 102, title: "الانضمام لمجموعة المناقشات والدعم", reward: 0.05, link: "https://t.me/telegram", completed: false, checking: false },
    { id: 103, title: "متابعة حساب البوت على منصة X", reward: 0.10, link: "https://twitter.com", completed: false, checking: false },
    { id: 104, title: "دعوة 3 أصدقاء للبوت", reward: 0.25, link: "#", completed: false, checking: false }
];

// تهيئة التطبيق عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', ( ) => {
    renderActiveBirds();
    renderShop();
    renderTasks();
    updateUI();

    // حلقة لزيادة الأرباح غير المجمعة مباشرة (كل 100 مللي ثانية)
    setInterval(() => {
        const perSecond = (userState.hourlyRate / 3600);
        userState.unclaimed += perSecond / 10;
        document.getElementById('unclaimed-balance').innerText = userState.unclaimed.toFixed(6);
    }, 100);
});

// تحديث واجهة المستخدم (UI Updates)
function updateUI() {
    document.getElementById('user-balance').innerText = userState.balance.toFixed(2);
    document.getElementById('hourly-rate-badge').innerText = `+$${userState.hourlyRate.toFixed(2)} / ساعة`;

    const dayIncome = userState.hourlyRate * 24;
    const monthIncome = dayIncome * 30;

    document.getElementById('stat-hour').innerText = `$${(userState.hourlyRate).toFixed(2)}`;
    document.getElementById('stat-day').innerText = `$${dayIncome.toFixed(2)}`;
    document.getElementById('stat-month').innerText = `$${monthIncome.toFixed(2)}`;

    document.getElementById('ref-count').innerText = userState.referrals;
    document.getElementById('ref-earnings').innerText = `$${userState.refEarnings.toFixed(2)}`;
}

// التبديل بين النوافذ (Tab Switching)
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

// إجراء: جمع الأرباح (Collect Earnings)
function collectEarnings() {
    if (userState.unclaimed <= 0.00001) {
        showToast("لا توجد أرباح كافية للجمع حالياً!", "fa-circle-exclamation", "text-amber-400");
        return;
    }
    const collected = userState.unclaimed;
    userState.balance += collected;
    userState.unclaimed = 0;
    updateUI();
    showToast(`تم جمع $${collected.toFixed(4)} إلى رصيدك!`, "fa-circle-check", "text-green-400");
}

// عرض الطيور النشطة (Render Active Birds)
function renderActiveBirds() {
    const container = document.getElementById('active-birds-grid');
    container.innerHTML = '';

    userState.inventory.forEach(item => {
        for (let i = 0; i < item.count; i++) {
            const card = document.createElement('div');
            card.className = "vintage-border bg-card-bg p-2 rounded-xl text-center flex flex-col items-center justify-center shadow-sm";
            card.innerHTML = `
                <img src="${item.image}" class="w-10 h-10 object-contain mb-1 drop-shadow" alt="${item.name}">
                <div class="text-[10px] font-bold text-amber-950">${item.name}</div>
                <div class="text-[9px] text-green-700 font-bold">+${item.dailyPercent}% يومياً</div>
            `;
            container.appendChild(card);
        }
    });
}

// عرض عناصر المتجر (Render Shop Items)
function renderShop() {
    const container = document.getElementById('shop-items-list');
    container.innerHTML = '';

    shopCatalog.forEach(item => {
        const card = document.createElement('div');
        card.className = "vintage-border bg-card-bg p-3 rounded-2xl text-center flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="text-[10px] text-amber-800 font-bold mb-1">دخل $${item.monthIncome.toFixed(2)} / شهرياً</div>
                <img src="${item.image}" class="w-16 h-16 mx-auto object-contain my-2" alt="${item.name}">
                <div class="font-bold text-xs text-amber-950">${item.name}</div>
                <div class="text-[10px] text-amber-700 font-bold my-1">بنسبة ${item.dailyPercent}% يومي دخل</div>
            </div>
            <button onclick="buyBird(${item.id})" class="mt-2 w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1">
                <i class="fa-solid fa-cart-shopping"></i> يشتري $${item.price.toFixed(2)}
            </button>
        `;
        container.appendChild(card);
    });
}

// إجراء: شراء طائر (Buy Bird)
function buyBird(id) {
    const item = shopCatalog.find(x => x.id === id);
    if (!item) return;

    if (userState.balance < item.price) {
        showToast("رصيدك غير كافٍ لشراء هذا الطائر!", "fa-circle-xmark", "text-red-400");
        return;
    }

    userState.balance -= item.price;
    
    // زيادة معدل الربح بالساعة
    const addedHourly = (item.price * (item.dailyPercent / 100)) / 24;
    userState.hourlyRate += addedHourly;

    // الإضافة إلى المخزون
    const existing = userState.inventory.find(x => x.id === id);
    if (existing) {
        existing.count++;
    } else {
        userState.inventory.push({ id: item.id, name: item.name, image: item.image, dailyPercent: item.dailyPercent, count: 1 });
    }

    renderActiveBirds();
    updateUI();
    showToast(`تم شراء ${item.name} بنجاح!`, "fa-circle-check", "text-green-400");
}

// عرض المهمات (Render Tasks)
function renderTasks() {
    const container = document.getElementById('tasks-list');
    container.innerHTML = '';

    tasks.forEach(t => {
        const item = document.createElement('div');
        item.className = "vintage-border bg-card-bg p-3 rounded-2xl flex items-center justify-between";
        
        let btnHtml = '';
        if (t.completed) {
            btnHtml = `<span class="text-xs text-green-600 font-bold flex items-center gap-1"><i class="fa-solid fa-check"></i> مكتمل</span>`;
        } else if (t.checking) {
            btnHtml = `<button disabled class="px-3 py-1.5 bg-gray-400 text-white text-xs font-bold rounded-lg animate-pulse">جاري التحقق...</button>`;
        } else {
            btnHtml = `<button onclick="doTask(${t.id})" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow active:scale-95">انضمام والتحقق</button>`;
        }

        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-sm">
                    <i class="fa-brands fa-telegram"></i>
                </div>
                <div>
                    <div class="font-bold text-xs text-amber-950">${t.title}</div>
                    <div class="text-[10px] text-green-700 font-bold">+ $${t.reward.toFixed(2)}</div>
                </div>
            </div>
            ${btnHtml}
        `;
        container.appendChild(item);
    });
}

// إجراء: تنفيذ المهمة (Do Task)
function doTask(id) {
    const task = tasks.find(x => x.id === id);
    if (!task || task.completed) return;

    // فتح الرابط
    window.open(task.link, '_blank');

    // تعيين حالة التحقق
    task.checking = true;
    renderTasks();

    // محاكاة تأخير التحقق من API تيليجرام
    setTimeout(() => {
        task.checking = false;
        task.completed = true;
        userState.balance += task.reward;
        updateUI();
        renderTasks();
        showToast(`أحسنت! تم إكمال المهمة وإضافة $${task.reward.toFixed(2)}`, "fa-circle-check", "text-green-400");
    }, 3000);
}

// إجراء: المكافأة اليومية (Daily Reward)
function claimDailyReward() {
    if (userState.dailyClaimed) {
        showToast("لقد حصلت على المكافأة اليومية بالفعل!", "fa-clock", "text-amber-400");
        return;
    }
    userState.dailyClaimed = true;
    userState.balance += 0.05;
    updateUI();

    const btn = document.getElementById('daily-btn');
    btn.innerText = "تم الجمع";
    btn.disabled = true;
    btn.className = "px-3 py-1.5 bg-gray-400 text-white text-xs font-bold rounded-lg cursor-not-allowed";

    showToast("تم إضافة 0.05$ المكافأة اليومية!", "fa-circle-check", "text-green-400");
}

// إجراء: نسخ رابط الإحالة (Copy Referral Link)
function copyRefLink() {
    const text = document.getElementById('ref-link-text').innerText;
    navigator.clipboard.writeText(text);
    showToast("تم نسخ رابط الإحالة الخاص بك!", "fa-copy", "text-blue-400");
}

// إجراء: عملية السحب (Withdrawal Process)
function processWithdrawal() {
    const method = document.getElementById('withdraw-method').value;
    const address = document.getElementById('withdraw-address').value.trim();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);

    if (!address) {
        showToast("يرجى إدخال عنوان المحفظة بشكل صحيح!", "fa-circle-exclamation", "text-red-400");
        return;
    }

    if (isNaN(amount) || amount < 0.50) {
        showToast("الحد الأدنى للسحب هو $0.50 دولار!", "fa-circle-exclamation", "text-amber-400");
        return;
    }

    if (amount > userState.balance) {
        showToast("رصيدك الحالي لا يكفي لإتمام الطلب!", "fa-circle-xmark", "text-red-400");
        return;
    }

    // خصم الرصيد وتسجيل العملية
    userState.balance -= amount;
    updateUI();

    const txHistory = document.getElementById('tx-history');
    if (txHistory.innerHTML.includes("لا توجد")) {
        txHistory.innerHTML = '';
    }

    const txItem = document.createElement('div');
    txItem.className = "flex justify-between items-center bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs my-1.5";
    txItem.innerHTML = `
        <div>
            <div class="font-bold text-amber-900">سحب عبر ${method.toUpperCase()}</div>
            <div class="text-[10px] text-gray-500">${address.substring(0, 12)}...</div>
        </div>
        <div class="text-right">
            <div class="font-black text-red-600">-$${amount.toFixed(2)}</div>
            <div class="text-[9px] text-amber-600 font-bold">قيد المعالجة ⏳</div>
        </div>
    `;
    txHistory.prepend(txItem);

    document.getElementById('withdraw-address').value = '';
    document.getElementById('withdraw-amount').value = '';

    showToast("تم إرسال طلب السحب بنجاح للمراجعة!", "fa-circle-check", "text-green-400");
}

// عرض إشعار (Show Toast Notification)
function showToast(message, iconClass = "fa-circle-check", iconColor = "text-green-400") {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');

    toastMsg.innerText = message;
    toastIcon.className = `fa-solid ${iconClass} ${iconColor}`;

    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none');
        toast.classList.remove('opacity-100');
    }, 3000);
}
