const tg = window.Telegram.WebApp;
tg.expand();

let points = Number(localStorage.getItem("points")) || 0;

const user = tg.initDataUnsafe.user;
if (user) {
  document.getElementById("username").innerText = user.first_name;
  document.getElementById("profile-info").innerText =
    `الاسم: ${user.first_name}\nID: ${user.id}`;
}

document.getElementById("points").innerText = points;

function addPoints() {
  points += 1;
  save();
}

function save() {
  localStorage.setItem("points", points);
  document.getElementById("points").innerText = points;
}

// Modals
function openModal(id) {
  document.getElementById(id).style.display = "block";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// Tasks
const tasks = [
  { title: "اشترك بالقناة", link: "https://t.me/telegram", reward: 100 },
  { title: "انضم للكروب", link: "https://t.me/example", reward: 150 }
];

const tasksList = document.getElementById("tasks-list");
tasks.forEach(t => {
  const btn = document.createElement("button");
  btn.innerText = `${t.title} (+${t.reward})`;
  btn.onclick = () => {
    window.open(t.link);
    points += t.reward;
    save();
  };
  tasksList.appendChild(btn);
});

// Codes
function redeemCode() {
  const code = document.getElementById("codeInput").value;

  if (code === "TON") {
    points += 1000;
  } else if (code === "IRAQ") {
    points += 2000;
  } else {
    tg.showAlert("❌ كود غير صحيح");
    return;
  }

  save();
  tg.showAlert("🎉 تم الاستلام");
  closeModal("codes");
}
