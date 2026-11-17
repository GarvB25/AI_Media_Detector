// ═══════════════════════════════════════
// Dashboard Module — Main App Logic
// ═══════════════════════════════════════

import { auth, db, API_BASE } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection, addDoc, getDocs, query,
  where, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Auth Guard ────────────────────────────────────────────────
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  initApp(user);
});

// ── Init App ──────────────────────────────────────────────────
async function initApp(user) {
  // Set user info in sidebar
  const name = user.displayName || user.email.split("@")[0];
  document.getElementById("sidebarName").textContent = name;
  document.getElementById("sidebarEmail").textContent = user.email;
  document.getElementById("greetName").textContent = name.split(" ")[0];

  // Set avatar initials
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  document.getElementById("sidebarAvatar").textContent = initials;

  // Load dashboard data
  await loadDashboardStats();
  await loadRecentHistory();
}

// ── Navigation ────────────────────────────────────────────────
const navItems = document.querySelectorAll(".nav-item");

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    switchView(item.dataset.view);
  });
});

window.switchView = function(viewName) {
  // Update nav
  navItems.forEach(item => {
    item.classList.toggle("active", item.dataset.view === viewName);
  });

  // Show view
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const view = document.getElementById(`view-${viewName}`);
  if (view) view.classList.add("active");

  // Update topbar title
  const titles = { dashboard: "Dashboard", detect: "New Detection", history: "History" };
  document.getElementById("topbarTitle").textContent = titles[viewName] || viewName;

  // Load history when switching to that view
  if (viewName === "history") loadFullHistory();

  // Close mobile sidebar
  closeSidebar();
};

// ── Mobile Sidebar ────────────────────────────────────────────
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
const menuBtn = document.getElementById("menuBtn");

menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
overlay.addEventListener("click", closeSidebar);

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("visible");
}

// ── Theme Toggle ─────────────────────────────────────────────
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

// Load saved theme
if (localStorage.getItem("theme") === "light") {
  root.setAttribute("data-theme", "light");
  toggleThemeIcon(true);
}

themeToggle.addEventListener("click", () => {
  const isLight = root.getAttribute("data-theme") === "light";
  root.setAttribute("data-theme", isLight ? "dark" : "light");
  localStorage.setItem("theme", isLight ? "dark" : "light");
  toggleThemeIcon(!isLight);
});

function toggleThemeIcon(isLight) {
  const moon = themeToggle.querySelector(".icon-moon");
  const sun = themeToggle.querySelector(".icon-sun");
  const span = themeToggle.querySelector("span");
  moon.classList.toggle("hidden", isLight);
  sun.classList.toggle("hidden", !isLight);
  if (span) span.textContent = isLight ? "Light Mode" : "Dark Mode";
}

// ── Logout ────────────────────────────────────────────────────
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ── Load Dashboard Stats ──────────────────────────────────────
async function loadDashboardStats() {
  try {
    const q = query(
      collection(db, "detections"),
      where("userId", "==", currentUser.uid)
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => d.data());

    const total = docs.length;
    const aiCount = docs.filter(d => d.verdict === "ai").length;
    const realCount = docs.filter(d => d.verdict === "real").length;
    const avgConf = total > 0
      ? Math.round(docs.reduce((s, d) => s + (d.confidence || 0), 0) / total)
      : null;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statAI").textContent = aiCount;
    document.getElementById("statReal").textContent = realCount;
    document.getElementById("statAccuracy").textContent = avgConf !== null ? `${avgConf}%` : "—";
  } catch (err) {
    console.error("Stats load error:", err);
  }
}

// ── Load Recent History (Dashboard) ──────────────────────────
async function loadRecentHistory() {
  try {
    const q = query(
      collection(db, "detections"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const snap = await getDocs(q);
    const container = document.getElementById("dashboardHistory");

    if (snap.empty) return; // keep empty state

    container.innerHTML = "";
    snap.docs.forEach(doc => {
      const d = doc.data();
      container.appendChild(createHistoryItem(d));
    });
  } catch (err) {
    console.error("History load error:", err);
  }
}

// ── Create History Item ───────────────────────────────────────
function createHistoryItem(data) {
  const item = document.createElement("div");
  item.className = "history-item";

  const isAI = data.verdict === "ai";
  const date = data.createdAt?.toDate?.()
    ? new Date(data.createdAt.toDate()).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Unknown date";

  const thumbHtml = data.mediaType === "video"
    ? `<div class="history-thumb">🎬</div>`
    : `<div class="history-thumb"><img src="${data.previewUrl || ''}" alt="thumb" onerror="this.parentElement.textContent='🖼️'"/></div>`;

  item.innerHTML = `
    ${thumbHtml}
    <div class="history-info">
      <div class="history-filename">${escapeHtml(data.filename || "Unknown file")}</div>
      <div class="history-date">${date} · ${data.confidence || 0}% confidence</div>
    </div>
    <span class="history-badge ${isAI ? 'badge-ai' : 'badge-real'}">${isAI ? 'AI' : 'Real'}</span>
  `;

  return item;
}

// ── Load Full History ─────────────────────────────────────────
async function loadFullHistory() {
  const grid = document.getElementById("historyGrid");
  grid.innerHTML = `<div class="empty-state"><p>Loading...</p></div>`;

  try {
    const filter = document.getElementById("historyFilter").value;
    let q = query(
      collection(db, "detections"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    let docs = snap.docs.map(d => d.data());

    // Client-side filter
    if (filter !== "all") {
      docs = docs.filter(d => d.verdict === filter);
    }

    if (docs.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="28" stroke="currentColor" stroke-width="1.5" opacity="0.3"/></svg>
          <p>No results found.</p>
        </div>`;
      return;
    }

    grid.innerHTML = "";
    docs.forEach(d => grid.appendChild(createHistoryCard(d)));
  } catch (err) {
    console.error("Full history error:", err);
    grid.innerHTML = `<div class="empty-state"><p>Error loading history.</p></div>`;
  }
}

function createHistoryCard(data) {
  const card = document.createElement("div");
  card.className = "history-card";
  const isAI = data.verdict === "ai";

  const date = data.createdAt?.toDate?.()
    ? new Date(data.createdAt.toDate()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Unknown";

  const thumbHtml = data.mediaType === "video"
    ? `<div style="font-size:40px;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">🎬</div>`
    : `<img src="${data.previewUrl || ''}" alt="thumb" onerror="this.style.display='none';this.parentElement.innerHTML='<div style=font-size:40px;display:flex;align-items:center;justify-content:center;width:100%;height:100%>🖼️</div>'"/>`;

  card.innerHTML = `
    <div class="history-card-thumb">
      ${thumbHtml}
      <span class="history-card-badge ${isAI ? 'badge-ai' : 'badge-real'}">${isAI ? '🤖 AI' : '✅ Real'}</span>
    </div>
    <div class="history-card-body">
      <div class="history-card-title">${escapeHtml(data.filename || "Unknown")}</div>
      <div class="history-card-meta">
        <span>${date}</span>
        <span>${data.confidence || 0}% confidence</span>
      </div>
    </div>
  `;
  return card;
}

// ── History Filter ────────────────────────────────────────────
document.getElementById("historyFilter").addEventListener("change", loadFullHistory);

// ═══════════════════════════════════════
// MEDIA DETECTION MODULE
// ═══════════════════════════════════════

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const filePreview = document.getElementById("filePreview");
const uploadBtn = document.getElementById("uploadBtn");
const clearFile = document.getElementById("clearFile");
const analyzeBtn = document.getElementById("analyzeBtn");

let selectedFile = null;
let filePreviewUrl = null;

// ── Drag & Drop ───────────────────────────────────────────────
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

dropZone.addEventListener("click", () => fileInput.click());
uploadBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

// ── Handle File Selection ─────────────────────────────────────
function handleFile(file) {
  // Validate type
  const allowedTypes = ["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/webm","video/ogg"];
  if (!allowedTypes.includes(file.type)) {
    showToast("Unsupported file type. Please use JPG, PNG, GIF, MP4, or WebM.", "error");
    return;
  }

  // Validate size (50MB)
  if (file.size > 50 * 1024 * 1024) {
    showToast("File too large. Maximum size is 50MB.", "error");
    return;
  }

  selectedFile = file;
  filePreviewUrl = URL.createObjectURL(file);

  // Show preview
  dropZone.classList.add("hidden");
  filePreview.classList.remove("hidden");

  document.getElementById("previewName").textContent = file.name;

  const mediaEl = document.getElementById("previewMedia");
  if (file.type.startsWith("video/")) {
    mediaEl.innerHTML = `<video src="${filePreviewUrl}" controls muted></video>`;
  } else {
    mediaEl.innerHTML = `<img src="${filePreviewUrl}" alt="Preview"/>`;
  }

  // Meta info
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  document.getElementById("previewMeta").textContent = `${file.type} · ${sizeMB} MB`;

  // Reset result panel
  resetResults();
}

// Clear file
clearFile.addEventListener("click", () => {
  selectedFile = null;
  if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
  filePreviewUrl = null;
  fileInput.value = "";
  filePreview.classList.add("hidden");
  dropZone.classList.remove("hidden");
  resetResults();
});

// ── Reset Results ─────────────────────────────────────────────
function resetResults() {
  document.getElementById("resultEmpty").classList.remove("hidden");
  document.getElementById("resultLoading").classList.add("hidden");
  document.getElementById("resultContent").classList.add("hidden");
  document.getElementById("resultPanel").style.alignItems = "center";
  document.getElementById("resultPanel").style.justifyContent = "center";
}

// ── Analyze ───────────────────────────────────────────────────
analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Analyzing...";

  // Show loading
  document.getElementById("resultEmpty").classList.add("hidden");
  document.getElementById("resultLoading").classList.remove("hidden");
  document.getElementById("resultContent").classList.add("hidden");
  document.getElementById("resultPanel").style.alignItems = "stretch";
  document.getElementById("resultPanel").style.justifyContent = "flex-start";

  // Animate loading steps
  const steps = [
    "Preprocessing media...",
    "Extracting features...",
    "Running AI analysis...",
    "Calculating confidence...",
    "Finalizing results..."
  ];
  let stepIdx = 0;
  const stepEl = document.getElementById("loadingStep");
  const stepInterval = setInterval(() => {
    stepEl.textContent = steps[stepIdx % steps.length];
    stepIdx++;
  }, 900);

  try {
    // Prepare form data for backend
    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("userId", currentUser.uid);

    // Get auth token
    const token = await currentUser.getIdToken();

    // Call backend API
    const response = await fetch(`${API_BASE}/detect`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Detection failed");
    }

    const result = await response.json();

    clearInterval(stepInterval);

    // Display result immediately — don't block on Firestore
    displayResult(result);

    showToast("Analysis complete!", "success");

    // Save to Firestore and refresh stats in background (non-blocking)
    saveDetection(result).then(() => {
      loadDashboardStats();
      loadRecentHistory();
    }).catch(err => console.error("Background save error:", err));

  } catch (err) {
    clearInterval(stepInterval);
    console.error("Detection error:", err);
    showToast(`Error: ${err.message}`, "error");

    // Show empty state again
    document.getElementById("resultLoading").classList.add("hidden");
    document.getElementById("resultEmpty").classList.remove("hidden");
    document.getElementById("resultPanel").style.alignItems = "center";
    document.getElementById("resultPanel").style.justifyContent = "center";
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `
      <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
      Analyze Media`;
  }
});

// ── Display Result ────────────────────────────────────────────
function displayResult(result) {
  document.getElementById("resultLoading").classList.add("hidden");
  const content = document.getElementById("resultContent");
  content.classList.remove("hidden");

  const isAI = result.verdict === "ai";
  const confidence = result.confidence;

  // Verdict banner
  const banner = document.getElementById("verdictBanner");
  banner.className = `verdict-banner ${isAI ? "ai" : "real"}`;
  document.getElementById("verdictIcon").textContent = isAI ? "🤖" : "✅";
  document.getElementById("verdictLabel").textContent = isAI ? "AI Generated" : "Real Media";
  document.getElementById("verdictSub").textContent = isAI
    ? `${confidence}% confident this is AI-generated`
    : `${confidence}% confident this is authentic`;

  // Confidence meter
  document.getElementById("confidenceValue").textContent = `${confidence}%`;
  const fill = document.getElementById("confidenceFill");
  // Use gradient: left=real (green), right=AI (red)
  fill.style.background = isAI
    ? `linear-gradient(90deg, #ffa502, #ff4757)`
    : `linear-gradient(90deg, #2ed573, #00d4ff)`;
  setTimeout(() => { fill.style.width = `${confidence}%`; }, 100);

  // Breakdown signals
  const breakdown = document.getElementById("analysisBreakdown");
  breakdown.innerHTML = "";
  if (result.signals) {
    Object.entries(result.signals).forEach(([label, score]) => {
      const pct = Math.round(score * 100);
      const color = pct > 60 ? "#ff4757" : pct > 30 ? "#ffa502" : "#2ed573";
      const item = document.createElement("div");
      item.className = "breakdown-item";
      item.innerHTML = `
        <div class="breakdown-label">${label}</div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="breakdown-val" style="color:${color}">${pct}%</div>
      `;
      breakdown.appendChild(item);
    });
  }

  // Analyzed media thumbnail
  const thumb = document.getElementById("analyzedThumb");
  if (filePreviewUrl) {
    if (selectedFile?.type.startsWith("video/")) {
      thumb.innerHTML = `<video src="${filePreviewUrl}" muted style="max-width:100%;max-height:150px;border-radius:8px;"></video>`;
    } else {
      thumb.innerHTML = `<img src="${filePreviewUrl}" alt="Analyzed" style="max-width:100%;max-height:150px;border-radius:8px;object-fit:contain"/>`;
    }
  }
}

// ── Save Detection to Firestore ───────────────────────────────
async function saveDetection(result) {
  try {
    // Convert file to base64 for preview storage (only for small images)
    let previewUrl = null;
    if (selectedFile && selectedFile.type.startsWith("image/") && selectedFile.size < 500000) {
      previewUrl = await fileToBase64(selectedFile);
    }

    await addDoc(collection(db, "detections"), {
      userId: currentUser.uid,
      filename: selectedFile?.name || "unknown",
      mediaType: selectedFile?.type.startsWith("video/") ? "video" : "image",
      verdict: result.verdict,
      confidence: result.confidence,
      signals: result.signals || {},
      previewUrl: previewUrl,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Save detection error:", err);
  }
}

// ── Helpers ───────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Toast Notifications ───────────────────────────────────────
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "none";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Make switchView and showToast available globally
window.showToast = showToast;
