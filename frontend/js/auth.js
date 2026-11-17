// ═══════════════════════════════════════
// Auth Module — Login / Signup
// ═══════════════════════════════════════

import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ── Redirect if already logged in ──────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});

// ── Tab Switching ──────────────────────────────────────────────
const tabs = document.querySelectorAll(".tab-btn");
const indicator = document.querySelector(".tab-indicator");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const isLogin = tab.dataset.tab === "login";
    loginForm.classList.toggle("hidden", !isLogin);
    signupForm.classList.toggle("hidden", isLogin);

    // Move indicator
    indicator.classList.toggle("right", !isLogin);
  });
});

// ── Password Toggle ────────────────────────────────────────────
document.querySelectorAll(".toggle-pw").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = btn.previousElementSibling;
    const isText = input.type === "text";
    input.type = isText ? "password" : "text";
    btn.querySelector(".eye-icon").style.opacity = isText ? "1" : "0.4";
  });
});

// ── Password Strength Meter ───────────────────────────────────
const pwInput = document.getElementById("signupPassword");
const pwBar = document.getElementById("pwBar");
const pwLabel = document.getElementById("pwLabel");

pwInput?.addEventListener("input", () => {
  const val = pwInput.value;
  const strength = getPasswordStrength(val);
  const colors = ["", "#ff4757", "#ffa502", "#00d4ff", "#2ed573"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const widths = ["0%", "25%", "50%", "75%", "100%"];

  pwBar.style.width = widths[strength];
  pwBar.style.background = colors[strength];
  pwLabel.textContent = val ? labels[strength] : "";
  pwLabel.style.color = colors[strength];
});

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 1;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

// ── Utility: Show Error ────────────────────────────────────────
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 6000);
}

// ── Utility: Set Loading State ─────────────────────────────────
function setLoading(btn, loading) {
  const text = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
  btn.disabled = loading;
  text.classList.toggle("hidden", loading);
  loader.classList.toggle("hidden", !loading);
}

// ── Firebase Error to Human Message ──────────────────────────
function getAuthError(code) {
  const errors = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/email-already-in-use": "This email is already registered. Try signing in.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many failed attempts. Please try again later.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/network-request-failed": "Network error. Check your internet connection."
  };
  return errors[code] || "Something went wrong. Please try again.";
}

// ── LOGIN ──────────────────────────────────────────────────────
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  // Validation
  if (!email || !password) {
    showError("loginError", "Please fill in all fields.");
    return;
  }

  setLoading(loginBtn, true);

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle redirect
  } catch (err) {
    showError("loginError", getAuthError(err.code));
    setLoading(loginBtn, false);
  }
});

// ── SIGNUP ─────────────────────────────────────────────────────
const signupBtn = document.getElementById("signupBtn");

signupBtn.addEventListener("click", async () => {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  // Validation
  if (!name || !email || !password) {
    showError("signupError", "Please fill in all fields.");
    return;
  }
  if (password.length < 8) {
    showError("signupError", "Password must be at least 8 characters.");
    return;
  }

  setLoading(signupBtn, true);

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Set display name
    await updateProfile(cred.user, { displayName: name });
    // onAuthStateChanged will redirect
  } catch (err) {
    showError("signupError", getAuthError(err.code));
    setLoading(signupBtn, false);
  }
});

// ── GOOGLE AUTH ────────────────────────────────────────────────
const provider = new GoogleAuthProvider();

async function googleAuth() {
  try {
    await signInWithPopup(auth, provider);
    // onAuthStateChanged will redirect
  } catch (err) {
    showError("loginError", getAuthError(err.code));
    showError("signupError", getAuthError(err.code));
  }
}

document.getElementById("googleLoginBtn").addEventListener("click", googleAuth);
document.getElementById("googleSignupBtn").addEventListener("click", googleAuth);

// ── Enter Key Support ──────────────────────────────────────────
document.getElementById("loginPassword").addEventListener("keydown", e => {
  if (e.key === "Enter") loginBtn.click();
});

document.getElementById("signupPassword").addEventListener("keydown", e => {
  if (e.key === "Enter") signupBtn.click();
});
