// 1. تهيئة تيليجرام (مع حماية لكي يعمل في المتصفح العادي للتجربة)
let tg = null;
if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    try { tg.expand(); } catch (e) {}
}

// 2. تهيئة إعلانات Adsgram
let AdController = null;
if (window.Adsgram) {
    AdController = window.Adsgram.init({ blockId: "int-22662" });
}

// 3. تهيئة Supabase
const supabaseUrl = 'https://kqhopvodwxvvvxiqjcyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxaG9wdm9kd3h2dnZ4aXFqY3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NzM1MjAsImV4cCI6MjEwNDQ0OTUyMH0.X7s4t1afpbHHd4u-jziupItmAjXC8VBarfUljxmd9dk';
const supabaseClient = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey ) : null;

// 4. بيانات المستخدم
const tgUser = tg?.initDataUnsafe?.user;
const telegramUserId = tgUser ? tgUser.id : Math.floor(Math.random() * 1000000);
const userName = tgUser ? tgUser.first_name : "مستخدم تجريبي";
const userPhoto = tgUser?.photo_url || null;
const startParam = tg?.initDataUnsafe?.start_param || null;

// عنوان محفظتك للإيداع وحسابك للتواصل
const ADMIN_WALLET_ADDRESS = "TVNLE1LbVYMSyUr5ndXuT4SfKSu13U3Lwx";
const ADMIN_TELEGRAM_USERNAME = "hamsterze"; // ضع يوزرك هنا بدون @

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

let tasks = [];
let tabClicks = 0; // عداد التنقل بين النوافذ للإعلانات

// كتالوج المتجر (تم تحديث صورة الطائر البرونزي بصورة طائر حقيقية وتعمل)
const shopCatalog = [
    { id: 1, name: "الطائر البرونزي", price: 0.10, monthIncome: 0.30, dailyPercent: 10, image: "https://cdn-icons-png.flaticon.com/512/2201/2201646.png" },
    { id: 2, name: "الطائر الناري", price: 3.00, monthIncome: 10.80, dailyPercent: 12, image: "https://cdn-icons-png.flaticon.com/512/2585/2585177.png" },
    { id: 3, name: "الطائر الفضي", price: 15.00, monthIncome: 63.00, dailyPercent: 14, image: "https://cdn-icons-png.flaticon.com/512/2585/2585197.png" },
    { id: 4, name: "الطائر الذهبي", price: 50.00, monthIncome: 240.00, dailyPercent: 16, image: "https://cdn-icons-png.flaticon.com/512/2585/2585202.png" },
    { id: 5, name: "الكاسر الآلي", price: 100.00, monthIncome: 720.00, dailyPercent: 24, image: "https://cdn-icons-png.flaticon.com/512/2585/2585215.png" }
];


// تهيئة التطبيق عند التحميل
window.addEventListener('DOMContentLoaded', async ( ) => {
    setupUserProfile();
    
    if (supabaseClient) {
        await loadUserData();
        await loadTasks();
    } else {
        showToast("خطأ في تحميل قاعدة البيانات", "fa-triangle-exclamation", "text-red-500");
    }
    
    renderActiveBirds();
    renderShop();
    updateUI();
    updateAdsLeftUI();

    // تحديث الأرباح الحية
    setInterval(() => {
        if (userState.hourlyRate > 0) {
            const perSecond = (userState.hourlyRate / 3600);
            userState.unclaimed += perSecond / 10;
            const unclaimedEl = document.getElementById('unclaimed-balance');
            if(unclaimedEl) unclaimedEl.innerText = userState.unclaimed.toFixed(6);
        }
    }, 100);
});

// إعداد صورة واسم المستخدم
function setupUserProfile() {
    const userNameEl = document.getElementById('user-name');
    if(userNameEl) userNameEl.innerText = userName;

    if (userPhoto) {
        const avatarContainer = document.getElementById('avatar-container');
        if(avatarContainer) avatarContainer.innerHTML = `<img src="${userPhoto}" class="w-full h-full object-cover">`;
    }
    
    const refLinkEl = document.getElementById('ref-link-text');
    // تم تعديل الرابط ليصبح خاصاً بالبوت الخاص بك
    if(refLinkEl) refLinkEl.innerText = `https://t.me/ddjdifjbot?start=ref_${telegramUserId}`;
    
    const adminWalletEl = document.getElementById('admin-wallet-display' );
    if(adminWalletEl) adminWalletEl.innerText = ADMIN_WALLET_ADDRESS;
}


// جلب بيانات المستخدم من Supabase
async function loadUserData() {
    try {
        const { data, error } = await supabaseClient.from('users').select('*').eq('id', telegramUserId).single();
        if (data) {
            userState.balance = data.balance || 0;
            userState.hourlyRate = data.hourly_rate || 0;
            userState.lastCollectTime = data.last_collect_time || Date.now();
            userState.referrals = data.referrals_count || 0;
            userState.refEarnings = data.ref_earnings || 0;
            userState.inventory = data.inventory || [];
            
            const now = Date.now();
            const hoursPassed = (now - userState.lastCollectTime) / (1000 * 60 * 60);
            if (hoursPassed > 0 && userState.hourlyRate > 0) {
                userState.unclaimed += (hoursPassed * userState.hourlyRate);
            }
        } else {
            await registerNewUser();
        }
    } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
    }
}

// تسجيل مستخدم جديد
async function registerNewUser() {
    let referredBy = null;
    if (startParam && startParam.startsWith('ref_')) {
        referredBy = parseInt(startParam.split('_')[1]);
        if (referredBy !== telegramUserId) {
            try {
                const { data: referrer } = await supabaseClient.from('users').select('referrals_count, ref_earnings, balance').eq('id', referredBy).single();
                if (referrer) {
                    await supabaseClient.from('users').update({
                        referrals_count: referrer.referrals_count + 1,
                        ref_earnings: referrer.ref_earnings + 0.10,
                        balance: referrer.balance + 0.10
                    }).eq('id', referredBy);
                }
            } catch (e) { console.error(e); }
        }
    }

    const defaultBird = [{ id: 1, name: "الطائر البرونزي", image: "https://cdn-icons-png.flaticon.com/512/2201/2201646.png", dailyPercent: 10, count: 1 }];
    const newUser = {
        id: telegramUserId,
        name: userName,
        balance: 0.05,
        hourly_rate: 0.10,
        last_collect_time: Date.now( ),
        referrals_count: 0,
        ref_earnings: 0,
        inventory: defaultBird,
        referred_by: referredBy
    };

    try {
        await supabaseClient.from('users').insert([newUser]);
    } catch (e) { console.error(e); }
    
    userState.balance = 0.05;
    userState.hourlyRate = 0.10;
    userState.inventory = defaultBird;
    userState.lastCollectTime = Date.now();
}

// حفظ بيانات المستخدم
async function saveUserData() {
    if (!supabaseClient) return;
    try {
        await supabaseClient.from('users').update({
            balance: userState.balance,
            hourly_rate: userState.hourlyRate,
            last_collect_time: userState.lastCollectTime,
            inventory: userState.inventory
        }).eq('id', telegramUserId);
    } catch (err) {
        console.error("خطأ في الحفظ:", err);
    }
}

// جلب المهمات
async function loadTasks() {
    try {
        const { data, error } = await supabaseClient.from('tasks').select('*').eq('is_active', true);
        if (data) {
            tasks = data;
            renderTasks();
        }
    } catch (err) {
        console.error("خطأ في المهمات:", err);
    }
}

// تحديث الواجهة
function updateUI() {
    const balanceEl = document.getElementById('user-balance');
    if(balanceEl) balanceEl.innerText = userState.balance.toFixed(2);
    
    const rateBadge = document.getElementById('hourly-rate-badge');
    if(rateBadge) rateBadge.innerText = `+$${userState.hourlyRate.toFixed(2)} / ساعة`;
    
    const statHour = document.getElementById('stat-hour');
    if(statHour) statHour.innerText = `$${(userState.hourlyRate).toFixed(2)}`;
    
    const statDay = document.getElementById('stat-day');
    if(statDay) statDay.innerText = `$${(userState.hourlyRate * 24).toFixed(2)}`;
    
    const statMonth = document.getElementById('stat-month');
    if(statMonth) statMonth.innerText = `$${(userState.hourlyRate * 24 * 30).toFixed(2)}`;
    
    const refCount = document.getElementById('ref-count');
    if(refCount) refCount.innerText = userState.referrals;
    
    const refEarnings = document.getElementById('ref-earnings');
    if(refEarnings) refEarnings.innerText = `$${userState.refEarnings.toFixed(2)}`;
}

// تحديث واجهة الإعلانات المتبقية
function updateAdsLeftUI() {
    let today = new Date().toDateString();
    let storedDate = localStorage.getItem('lastAdDate');
    let watched = parseInt(localStorage.getItem('adsWatchedToday') || '0');
    if (storedDate !== today) watched = 0;
    
    const adsLeftEl = document.getElementById('ads-left');
    if(adsLeftEl) adsLeftEl.innerText = Math.max(0, 5 - watched);
}

// التبديل بين النوافذ (مع إعلان كل 3 ضغطات)
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'text-amber-800', 'bg-amber-200/60');
        btn.classList.add('text-amber-700/60');
    });
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.classList.remove('hidden');
    
    const activeBtn = document.getElementById(`nav-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'text-amber-800', 'bg-amber-200/60');
        activeBtn.classList.remove('text-amber-700/60');
    }

    // إظهار إعلان كل 3 تنقلات
    tabClicks++;
    if (tabClicks % 3 === 0 && AdController) {
        AdController.show().catch(() => {}); // تجاهل الخطأ إذا أغلقه
    }
};

// جمع الأرباح (مع مشاهدة إعلان)
window.collectEarnings = function() {
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

    // دالة تنفيذ الجمع
    const processCollect = () => {
        userState.balance += userState.unclaimed;
        userState.unclaimed = 0;
        userState.lastCollectTime = Date.now();
        updateUI();
        saveUserData();
        showToast("تم جمع الأرباح بنجاح!", "fa-circle-check", "text-green-400");
    };

    // عرض الإعلان قبل الجمع
    if (AdController) {
        AdController.show().then((result) => {
            processCollect();
        }).catch((err) => {
            // إذا فشل الإعلان أو تخطاه، نعطيه الأرباح أيضاً لكي لا ينزعج
            processCollect();
        });
    } else {
        processCollect();
    }
};

// شاهد واربح (5 إعلانات يومياً)
window.watchAdForReward = function() {
    let today = new Date().toDateString();
    let storedDate = localStorage.getItem('lastAdDate');
    let watched = parseInt(localStorage.getItem('adsWatchedToday') || '0');

    if (storedDate !== today) {
        watched = 0;
        localStorage.setItem('lastAdDate', today);
    }

    if (watched >= 5) {
        showToast("لقد شاهدت الحد الأقصى للإعلانات اليوم (5/5)", "fa-circle-xmark", "text-red-400");
        return;
    }

    if (AdController) {
        AdController.show().then((result) => {
            if (result.done) {
                watched++;
                localStorage.setItem('adsWatchedToday', watched.toString());
                userState.balance += 0.01;
                updateUI();
                saveUserData();
                updateAdsLeftUI();
                showToast("تمت إضافة 0.01$ لرصيدك!", "fa-circle-check", "text-green-400");
            }
        }).catch((err) => {
            showToast("حدث خطأ أو قمت بإغلاق الإعلان مبكراً", "fa-circle-exclamation", "text-amber-400");
        });
    } else {
        showToast("نظام الإعلانات غير متوفر حالياً", "fa-circle-exclamation", "text-amber-400");
    }
};

// عرض الطيور
function renderActiveBirds() {
    const container = document.getElementById('active-birds-grid');
    if (!container) return;
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
    if (!container) return;
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
window.buyBird = function(id) {
    const item = shopCatalog.find(x => x.id === id);
    if (userState.balance < item.price) {
        showToast("رصيدك غير كافٍ! قم بعمل إيداع أولاً.", "fa-circle-xmark", "text-red-400");
        openDepositModal();
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
};

// عرض المهمات
function renderTasks() {
    const container = document.getElementById('tasks-list');
    if (!container) return;
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
window.doTask = function(id, link, reward) {
    window.open(link, '_blank');
    setTimeout(() => {
        userState.balance += reward;
        updateUI();
        saveUserData();
        showToast(`تمت إضافة مكافأة المهمة $${reward}!`, "fa-circle-check", "text-green-400");
    }, 5000);
};

// نسخ الرابط
window.copyRefLink = function() {
    const refText = document.getElementById('ref-link-text');
    if (refText) {
        navigator.clipboard.writeText(refText.innerText);
        showToast("تم نسخ الرابط!", "fa-copy", "text-blue-400");
    }
};

// مشاركة الرابط مباشرة عبر تيليجرام
window.shareRefLink = function() {
    const refText = document.getElementById('ref-link-text');
    if (refText) {
        const url = refText.innerText;
        const text = encodeURIComponent("انضم إلي في بوت CryptSon وابدأ في ربح الدولارات مجاناً! 🚀💸");
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url )}&text=${text}`;
        
        // فتح نافذة المشاركة الخاصة بتيليجرام
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            window.open(shareUrl, '_blank');
        }
    }
};


// طلب السحب (تم تعديل الحد الأدنى وإضافة التحويل للمسؤول)
window.processWithdrawal = async function() {
    const method = document.getElementById('withdraw-method').value;
    const address = document.getElementById('withdraw-address').value.trim();
    const amount = parseFloat(document.getElementById('withdraw-amount').value);

    // شرط 20 إحالة
    if (userState.referrals < 20) {
        showToast("يجب دعوة 20 شخصاً! سيتم تحويلك للمسؤول.", "fa-circle-xmark", "text-red-500");
        setTimeout(() => {
            window.open(`https://t.me/${ADMIN_TELEGRAM_USERNAME}`, '_blank' );
        }, 2000);
        return;
    }

    // شرط 50 دولار
    if (!address || isNaN(amount) || amount < 50 || amount > userState.balance) {
        showToast("تأكد من البيانات (الحد الأدنى 50$)", "fa-circle-exclamation", "text-amber-400");
        return;
    }

    userState.balance -= amount;
    updateUI();
    saveUserData();

    if (supabaseClient) {
        await supabaseClient.from('withdrawals').insert([{
            user_id: telegramUserId,
            method: method,
            address: address,
            amount: amount,
            status: 'pending'
        }]);
    }

    document.getElementById('withdraw-address').value = '';
    document.getElementById('withdraw-amount').value = '';
    showToast("تم إرسال طلب السحب للمراجعة!", "fa-circle-check", "text-green-400");
};

// دوال نافذة الإيداع
window.openDepositModal = function() {
    const modal = document.getElementById('deposit-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeDepositModal = function() {
    const modal = document.getElementById('deposit-modal');
    if (modal) modal.classList.add('hidden');
};

window.submitDeposit = async function() {
    const txid = document.getElementById('deposit-txid').value.trim();
    const amount = parseFloat(document.getElementById('deposit-amount').value);

    if (!txid || isNaN(amount) || amount <= 0) {
        showToast("يرجى إدخال رقم العملية والمبلغ بشكل صحيح!", "fa-circle-xmark", "text-red-400");
        return;
    }

    if (supabaseClient) {
        await supabaseClient.from('deposits').insert([{
            user_id: telegramUserId,
            tx_hash: txid,
            amount: amount,
            status: 'pending'
        }]);
    }

    closeDepositModal();
    document.getElementById('deposit-txid').value = '';
    document.getElementById('deposit-amount').value = '';
    showToast("تم إرسال طلب الإيداع! سيتم إضافة الرصيد بعد المراجعة.", "fa-clock", "text-blue-400");
};

// إشعارات
window.showToast = function(message, iconClass = "fa-circle-check", iconColor = "text-green-400") {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');
    
    if (!toast || !toastMsg || !toastIcon) return;

    toastMsg.innerText = message;
    toastIcon.className = `fa-solid ${iconClass} ${iconColor}`;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none');
        toast.classList.remove('opacity-100');
    }, 3000);
};
