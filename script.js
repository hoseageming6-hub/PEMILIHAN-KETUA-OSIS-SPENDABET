// DEMO LOKAL SAJA — BUKAN SISTEM PEMILIHAN RESMI.
// Data disimpan di browser menggunakan localStorage.

const DEMO_ADMIN_PASSWORD = "osis2026";
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const defaultCandidates = [
  { id: "p1", name: "Paslon 1", vision: "Visi dan misi Paslon 1" },
  { id: "p2", name: "Paslon 2", vision: "Visi dan misi Paslon 2" }
];

function readData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let codes = readData("osis_codes", []);
let votes = readData("osis_votes", []);
let candidates = readData("osis_candidates", defaultCandidates);
let appearance = readData("osis_appearance", {
  schoolName: "SMPN 2 Mrebet",
  background: "#eef3ff"
});

let currentCode = null;
let selectedCandidate = null;
let adminAuthenticated = false;

function showOnly(id) {
  [
    "home", "ballot", "thanks",
    "adminLogin", "dashboard"
  ].forEach(section => {
    document.getElementById(section).classList.toggle(
      "hidden", section !== id
    );
  });
}

function backHome() {
  currentCode = null;
  selectedCandidate = null;
  document.getElementById("voterCode").value = "";
  document.getElementById("message").textContent = "";
  document.getElementById("voteMessage").textContent = "";
  showOnly("home");
}

function startVoting() {
  const entered = document.getElementById("voterCode")
    .value.trim().toUpperCase();

  const code = codes.find(item => item.code === entered);

  if (!code) {
    document.getElementById("message").textContent =
      "Kode tidak ditemukan. Periksa kembali kode kamu.";
    return;
  }

  if (code.used) {
    document.getElementById("message").textContent =
      "Kode ini sudah digunakan.";
    return;
  }

  if (candidates.length < 2) {
    document.getElementById("message").textContent =
      "Belum tersedia cukup pasangan calon.";
    return;
  }

  currentCode = entered;
  selectedCandidate = null;
  renderBallot();
  showOnly("ballot");
}

function renderBallot() {
  const container = document.getElementById("candidates");
  container.replaceChildren();

  candidates.forEach(candidate => {
    const card = document.createElement("article");
    card.className = "candidate";
    card.dataset.id = candidate.id;

    const title = document.createElement("h3");
    title.textContent = candidate.name;

    const vision = document.createElement("p");
    vision.textContent = candidate.vision;

    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "candidate";
    radio.value = candidate.id;

    radio.addEventListener("change", () => {
      selectedCandidate = candidate.id;
      document.querySelectorAll(".candidate").forEach(el => {
        el.classList.toggle(
          "selected", el.dataset.id === selectedCandidate
        );
      });
    });

    label.append(radio, document.createTextNode(" Pilih paslon"));
    card.append(title, vision, label);
    container.append(card);
  });
}

function submitVote() {
  if (!currentCode || !selectedCandidate) {
    document.getElementById("voteMessage").textContent =
      "Pilih satu pasangan calon terlebih dahulu.";
    return;
  }

  const code = codes.find(item => item.code === currentCode);

  if (!code || code.used) {
    alert("Kode tidak valid atau sudah digunakan.");
    backHome();
    return;
  }

  // Tandai kode sudah digunakan.
  code.used = true;
  saveData("osis_codes", codes);

  // Catatan suara tidak menyimpan kode pemilih.
  votes.push({
    candidateId: selectedCandidate,
    className: code.className,
    time: new Date().toISOString()
  });
  saveData("osis_votes", votes);

  currentCode = null;
  selectedCandidate = null;
  showOnly("thanks");
}

function cancelVoting() {
  currentCode = null;
  selectedCandidate = null;
  backHome();
}

function showAdminLogin() {
  document.getElementById("adminPassword").value = "";
  document.getElementById("adminMessage").textContent = "";
  showOnly("adminLogin");
}

function loginAdmin() {
  const password = document.getElementById("adminPassword").value;

  if (password !== DEMO_ADMIN_PASSWORD) {
    document.getElementById("adminMessage").textContent =
      "Kata sandi salah.";
    return;
  }

  adminAuthenticated = true;
  renderDashboard();
  showOnly("dashboard");
}

function logoutAdmin() {
  adminAuthenticated = false;
  backHome();
}

function generateCodes() {
  if (!adminAuthenticated) return;

  const className = document.getElementById("classSelect").value;
  const count = Number(document.getElementById("codeCount").value);

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    alert("Masukkan jumlah kode antara 1 dan 100.");
    return;
  }

  const existingForClass = codes.filter(
    item => item.className === className
  );

  if (existingForClass.length > 0) {
    const confirmCreate = confirm(
      `Kelas ${className} sudah memiliki ${existingForClass.length} kode. Tambah ${count} kode lagi?`
    );
    if (!confirmCreate) return;
  }

  const existingCodes = new Set(codes.map(item => item.code));
  let created = 0;

  while (created < count) {
    let code = "";

    for (let i = 0; i < 5; i++) {
      code += CODE_CHARS[
        Math.floor(Math.random() * CODE_CHARS.length)
      ];
    }

    if (existingCodes.has(code)) continue;

    existingCodes.add(code);
    codes.push({ code, className, used: false });
    created++;
  }

  saveData("osis_codes", codes);
  renderDashboard();
  alert(`Demo: berhasil membuat ${created} kode untuk ${className}.`);
}

function downloadCodes() {
  if (!adminAuthenticated) return;

  const rows = [
    ["Kelas", "Kode", "Status"],
    ...codes.map(item => [
      item.className,
      item.code,
      item.used ? "Sudah digunakan" : "Belum digunakan"
    ])
  ];

  const csv = rows.map(row =>
    row.map(value =>
      '"' + String(value).replace(/"/g, '""') + '"'
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kode-pemilih-demo.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function renderDashboard() {
  if (!adminAuthenticated) return;

  renderCodes();
  renderStats();
  renderResults();
  renderCandidateAdmin();

  document.getElementById("newSchoolName").value =
    appearance.schoolName;

  document.getElementById("newBackground").value =
    appearance.background;
}

function renderCodes() {
  const body = document.getElementById("codeTable");
  body.replaceChildren();

  codes.forEach((item, index) => {
    const row = body.insertRow();

    [
      index + 1,
      item.className,
      item.code,
      item.used ? "Sudah dipakai" : "Belum dipakai"
    ].forEach(value => {
      const cell = row.insertCell();
      cell.textContent = value;
    });
  });
}

function renderStats() {
  const total = codes.length;
  const used = codes.filter(item => item.used).length;

  document.getElementById("schoolStats").textContent =
    `Seluruh sekolah: ${used} dari ${total} kode telah digunakan.`;

  const classes = [...new Set(codes.map(item => item.className))];
  const body = document.getElementById("classStats");
  body.replaceChildren();

  classes.forEach(className => {
    const list = codes.filter(item => item.className === className);
    const usedCount = list.filter(item => item.used).length;
    const row = body.insertRow();

    [className, list.length, usedCount, list.length - usedCount]
      .forEach(value => {
        row.insertCell().textContent = value;
      });
  });
}

function renderResults() {
  const container = document.getElementById("results");
  container.replaceChildren();

  candidates.forEach(candidate => {
    const count = votes.filter(
      vote => vote.candidateId === candidate.id
    ).length;

    const line = document.createElement("p");
    line.textContent = `${candidate.name}: ${count} suara`;
    container.append(line);
  });

  const total = document.createElement("p");
  total.textContent = `Total suara tercatat: ${votes.length}`;
  container.append(total);
}

function addCandidate() {
  if (!adminAuthenticated) return;

  const name = document.getElementById("candidateName")
    .value.trim();
  const vision = document.getElementById("candidateVision")
    .value.trim();

  if (!name) {
    alert("Masukkan nama pasangan calon.");
    return;
  }

  candidates.push({
    id: "p" + Date.now(),
    name,
    vision: vision || "Belum diisi"
  });

  saveData("osis_candidates", candidates);
  document.getElementById("candidateName").value = "";
  document.getElementById("candidateVision").value = "";
  renderDashboard();
}

function renderCandidateAdmin() {
  const container = document.getElementById("candidateAdmin");
  container.replaceChildren();

  candidates.forEach(candidate => {
    const row = document.createElement("div");
    row.className = "candidate";

    const title = document.createElement("strong");
    title.textContent = candidate.name;

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.onclick = () => editCandidate(candidate.id);

    const remove = document.createElement("button");
    remove.textContent = "Hapus";
    remove.className = "secondary";
    remove.onclick = () => deleteCandidate(candidate.id);

    row.append(title, document.createElement("br"), edit, remove);
    container.append(row);
  });
}

function editCandidate(id) {
  if (!adminAuthenticated) return;

  const candidate = candidates.find(item => item.id === id);
  if (!candidate) return;

  const name = prompt("Nama pasangan calon:", candidate.name);
  if (name === null || !name.trim()) return;

  const vision = prompt("Visi dan misi:", candidate.vision);
  if (vision === null) return;

  candidate.name = name.trim();
  candidate.vision = vision.trim();

  saveData("osis_candidates", candidates);
  renderDashboard();
}

function deleteCandidate(id) {
  if (!adminAuthenticated) return;

  if (votes.some(vote => vote.candidateId === id)) {
    alert("Demo ini tidak mengizinkan penghapusan paslon yang sudah memiliki suara.");
    return;
  }

  if (candidates.length <= 2) {
    alert("Pertahankan minimal dua pasangan calon.");
    return;
  }

  if (!confirm("Hapus pasangan calon ini dari demo?")) return;

  candidates = candidates.filter(item => item.id !== id);
  saveData("osis_candidates", candidates);
  renderDashboard();
}

function saveAppearance() {
  if (!adminAuthenticated) return;

  appearance = {
    schoolName: document.getElementById("newSchoolName")
      .value.trim() || "SMPN 2 Mrebet",
    background: document.getElementById("newBackground").value
  };

  saveData("osis_appearance", appearance);
  applyAppearance();
  alert("Tampilan demo berhasil diperbarui.");
}

function applyAppearance() {
  document.getElementById("schoolName").textContent =
    appearance.schoolName;

  document.body.style.background = appearance.background;
}

applyAppearance();
showOnly("home");
