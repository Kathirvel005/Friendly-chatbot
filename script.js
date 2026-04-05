const authModal = document.getElementById("authModal");
const setupModal = document.getElementById("setupModal");
const authMessage = document.getElementById("authMessage");
const setupMessage = document.getElementById("setupMessage");
const chatBox = document.getElementById("chatBox");
const typingIndicator = document.getElementById("typingIndicator");
const messageInput = document.getElementById("messageInput");

let currentProfile = null;
let voiceReplyEnabled = true;

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function handleKey(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

async function registerUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch("/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  authMessage.textContent = data.message;
}

async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch("/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.success) {
    authModal.classList.add("hidden");
    currentProfile = data.profile;

    if (!currentProfile.name || !currentProfile.gender || !currentProfile.mode) {
      setupModal.classList.remove("hidden");
    } else {
      updateProfileUI(currentProfile, true);
      addMessage(`Alright ${displayName()}, I’m ready in ${currentProfile.mode} Mode 💫`, "ai");
    }
  } else {
    authMessage.textContent = data.message;
  }
}

async function saveSetup() {
  const name = document.getElementById("name").value.trim();
  const nickname = document.getElementById("nickname").value.trim();
  const gender = document.getElementById("gender").value;
  const mode = document.getElementById("mode").value;
  const language = document.getElementById("language").value;

  const res = await fetch("/save_setup", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name, nickname, gender, mode, language })
  });

  const data = await res.json();

  if (data.success) {
    setupModal.classList.add("hidden");
    currentProfile = { ...(currentProfile || {}), name, nickname, gender, mode, language };
    updateProfileUI(currentProfile, true);
    addMessage(`Alright ${displayName()}, I’m ready in ${mode} Mode 💫`, "ai");
  } else {
    setupMessage.textContent = data.message;
  }
}

function displayName() {
  if (!currentProfile) return "Friend";
  return currentProfile.nickname?.trim() || currentProfile.name || "Friend";
}

function updateProfileUI(profile, aiEnabled = false) {
  document.getElementById("profileName").textContent = profile.name || "-";
  document.getElementById("profileNickname").textContent = profile.nickname || "-";
  document.getElementById("profileGender").textContent = profile.gender || "-";
  document.getElementById("profileMode").textContent = profile.mode || "-";
  document.getElementById("profileLanguage").textContent = profile.language || "English";
  document.getElementById("profileAI").textContent = aiEnabled ? "Real AI / Smart Hybrid" : "Local Smart Reply";
  document.getElementById("topTitle").textContent = `${displayName()}'s AI Companion`;
  document.getElementById("topSub").textContent = `${profile.mode} Mode active • ${profile.language || "English"}`;
}

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  messageInput.value = "";
  typingIndicator.style.display = "block";

  const res = await fetch("/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message })
  });

  const data = await res.json();
  const randomDelay = Math.floor(Math.random() * 900) + 500;

  setTimeout(() => {
    typingIndicator.style.display = "none";
    if (data.success) {
      addMessage(data.reply, "ai");

      if (currentProfile) {
        currentProfile.nickname = data.nickname || currentProfile.nickname || "";
        currentProfile.language = data.language || currentProfile.language || "English";
        updateProfileUI(currentProfile, data.ai_enabled);
      }

      if (voiceReplyEnabled) {
        speakText(data.reply);
      }
    } else {
      addMessage(data.message, "ai");
    }
  }, randomDelay);
}

async function loadHistory() {
  const res = await fetch("/history");
  const data = await res.json();

  if (data.success) {
    chatBox.innerHTML = "";
    if (data.history.length === 0) {
      addMessage("No previous chat history found.", "ai");
      return;
    }

    data.history.forEach(item => {
      addMessage(item.user, "user");
      addMessage(item.ai, "ai");
    });
  }
}

async function switchMode(mode) {
  if (!currentProfile) return;

  currentProfile.mode = mode;

  const res = await fetch("/save_setup", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      name: currentProfile.name,
      nickname: currentProfile.nickname || "",
      gender: currentProfile.gender,
      mode: currentProfile.mode,
      language: currentProfile.language || "English"
    })
  });

  const data = await res.json();

  if (data.success) {
    updateProfileUI(currentProfile, true);
    addMessage(`Mode switched. I’m now in ${mode} Mode 💫`, "ai");
  }
}

async function logout() {
  const res = await fetch("/logout", { method: "POST" });
  const data = await res.json();
  if (data.success) {
    location.reload();
  }
}

function toggleTheme() {
  const body = document.body;
  body.classList.toggle("dark");
  body.classList.toggle("light");
}

function toggleVoiceReply() {
  voiceReplyEnabled = !voiceReplyEnabled;
  addMessage(
    voiceReplyEnabled ? "Voice reply turned on 🔊" : "Voice reply turned off 🔇",
    "ai"
  );
}

function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice input is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const lang = currentProfile?.language || "English";
  if (lang === "Tamil") recognition.lang = "ta-IN";
  else if (lang === "Mixed") recognition.lang = "ta-IN";
  else recognition.lang = "en-US";

  recognition.start();

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    messageInput.value = transcript;
  };
}

function speakText(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const pref = currentProfile?.language || "English";

  let chosenVoice = null;

  if (pref === "Tamil" || pref === "Mixed") {
    chosenVoice = voices.find(v => v.lang && v.lang.toLowerCase().includes("ta"));
  }

  if (!chosenVoice && pref === "English") {
    chosenVoice = voices.find(v => v.lang && v.lang.toLowerCase().includes("en"));
  }

  if (chosenVoice) {
    utterance.voice = chosenVoice;
    utterance.lang = chosenVoice.lang;
  } else {
    utterance.lang = pref === "Tamil" ? "ta-IN" : "en-US";
  }

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

window.speechSynthesis.onvoiceschanged = () => {
  window.speechSynthesis.getVoices();
};

window.onload = async function () {
  const res = await fetch("/profile");
  const data = await res.json();

  if (data.success) {
    authModal.classList.add("hidden");
    currentProfile = data.profile;

    if (!currentProfile.name || !currentProfile.gender || !currentProfile.mode) {
      setupModal.classList.remove("hidden");
    } else {
      updateProfileUI(currentProfile, data.ai_enabled);
      addMessage(`Alright ${displayName()}, I’m ready in ${currentProfile.mode} Mode 💫`, "ai");
    }
  }
};