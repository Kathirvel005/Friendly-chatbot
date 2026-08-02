// Advanced JS controller for AI Companion Ultra

const authModal = document.getElementById("authModal");
const setupModal = document.getElementById("setupModal");
const settingsModal = document.getElementById("settingsModal");
const authMessage = document.getElementById("authMessage");
const setupMessage = document.getElementById("setupMessage");
const settingsMessage = document.getElementById("settingsMessage");
const chatBox = document.getElementById("chatBox");
const typingIndicator = document.getElementById("typingIndicator");
const messageInput = document.getElementById("messageInput");

let currentProfile = null;
let voiceReplyEnabled = true;

// Custom Helper to create message elements with Avatars and Timestamps
function addMessage(text, sender, timeStr = null) {
  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${sender}`;

  // Avatar Creation
  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  
  if (sender === "ai") {
    const mode = currentProfile?.mode || "Friendship";
    if (mode === "Lover") {
      avatar.innerHTML = '<i class="fa-solid fa-heart"></i>';
    } else if (mode === "Flirty") {
      avatar.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
    } else {
      avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
    }
  } else {
    avatar.innerHTML = '<i class="fa-solid fa-user-astronaut"></i>';
  }
  wrapper.appendChild(avatar);

  // Content Area
  const contentArea = document.createElement("div");
  contentArea.className = "message-content-area";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;
  contentArea.appendChild(bubble);

  // Timestamp
  const time = document.createElement("div");
  time.className = "message-time";
  if (!timeStr) {
    const now = new Date();
    timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  time.textContent = timeStr;
  contentArea.appendChild(time);

  wrapper.appendChild(contentArea);
  chatBox.appendChild(wrapper);
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

  if (!username || !password) {
    authMessage.textContent = "Please fill in all fields.";
    return;
  }

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

  if (!username || !password) {
    authMessage.textContent = "Please fill in all fields.";
    return;
  }

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
      updateProfileUI(currentProfile, data.ai_enabled || false);
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

  if (!name || !gender || !mode) {
    setupMessage.textContent = "Name, Gender, and Mode are required.";
    return;
  }

  const res = await fetch("/save_setup", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name, nickname, gender, mode, language })
  });

  const data = await res.json();

  if (data.success) {
    setupModal.classList.add("hidden");
    currentProfile = { ...(currentProfile || {}), name, nickname, gender, mode, language };
    updateProfileUI(currentProfile, data.ai_enabled || false);
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
  
  // Set avatar badge based on gender
  const avatarBadge = document.getElementById("profileAvatarBadge");
  if (profile.gender === "Female") {
    avatarBadge.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
  } else if (profile.gender === "Male") {
    avatarBadge.innerHTML = '<i class="fa-solid fa-user-astronaut"></i>';
  } else {
    avatarBadge.innerHTML = '<i class="fa-solid fa-user-shield"></i>';
  }

  // Update AI engine text
  const engineText = document.getElementById("profileAI");
  if (profile.api_provider === "openai") {
    engineText.textContent = `OpenAI GPT (${profile.openai_model})`;
  } else if (profile.api_provider === "gemini") {
    engineText.textContent = `Gemini (${profile.gemini_model})`;
  } else {
    engineText.textContent = "Local Smart Reply";
  }

  document.getElementById("topTitle").textContent = `${displayName()}'s Companion`;
  document.getElementById("topSub").textContent = `${profile.mode} Mode • ${profile.language || "English"}`;

  // Update active state of Chat Mode buttons
  document.querySelectorAll(".mode-buttons button").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.getElementById("btn" + profile.mode);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  messageInput.value = "";
  typingIndicator.style.display = "block";
  chatBox.scrollTop = chatBox.scrollHeight;

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
      addMessage(`Hey ${displayName()}! How can I help you today?`, "ai");
      return;
    }

    data.history.forEach(item => {
      // Format backend full date string to local time only
      let timeFormatted = null;
      if (item.time) {
        try {
          const t = new Date(item.time);
          timeFormatted = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch(e) {}
      }
      addMessage(item.user, "user", timeFormatted);
      addMessage(item.ai, "ai", timeFormatted);
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

async function clearChatHistory() {
  if (!confirm("Are you sure you want to clear all chat history? This cannot be undone.")) {
    return;
  }

  const res = await fetch("/clear_history", { method: "POST" });
  const data = await res.json();
  if (data.success) {
    chatBox.innerHTML = "";
    addMessage("Chat history cleared. Send a message to start a new chat!", "ai");
  } else {
    alert(data.message);
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
  const btn = document.getElementById("btnVoiceReply");
  if (voiceReplyEnabled) {
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Voice Reply: On';
    addMessage("Voice reply turned on 🔊", "ai");
  } else {
    btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Voice Reply: Off';
    addMessage("Voice reply turned off 🔇", "ai");
  }
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

// Engine Settings Modal functions
function openSettings() {
  if (!currentProfile) return;
  
  // Populate form with current values
  document.getElementById("apiProvider").value = currentProfile.api_provider || "local";
  document.getElementById("openaiKey").value = currentProfile.openai_key || "";
  document.getElementById("geminiKey").value = currentProfile.gemini_key || "";
  document.getElementById("openaiModel").value = currentProfile.openai_model || "gpt-4o-mini";
  document.getElementById("geminiModel").value = currentProfile.gemini_model || "gemini-2.5-flash";
  
  toggleApiFields();
  settingsMessage.textContent = "";
  settingsModal.classList.remove("hidden");
}

function closeSettings() {
  settingsModal.classList.add("hidden");
}

function toggleApiFields() {
  const provider = document.getElementById("apiProvider").value;
  const openaiFields = document.getElementById("openaiFields");
  const geminiFields = document.getElementById("geminiFields");
  
  openaiFields.classList.add("hidden");
  geminiFields.classList.add("hidden");
  
  if (provider === "openai") {
    openaiFields.classList.remove("hidden");
  } else if (provider === "gemini") {
    geminiFields.classList.remove("hidden");
  }
}

async function saveSettings() {
  const provider = document.getElementById("apiProvider").value;
  const openaiKey = document.getElementById("openaiKey").value.trim();
  const geminiKey = document.getElementById("geminiKey").value.trim();
  const openaiModel = document.getElementById("openaiModel").value;
  const geminiModel = document.getElementById("geminiModel").value;

  const res = await fetch("/save_settings", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      api_provider: provider,
      openai_key: openaiKey,
      gemini_key: geminiKey,
      openai_model: openaiModel,
      gemini_model: geminiModel
    })
  });

  const data = await res.json();
  if (data.success) {
    currentProfile.api_provider = provider;
    currentProfile.openai_model = openaiModel;
    currentProfile.gemini_model = geminiModel;
    
    // Save partially masked keys to currentProfile for form loading
    if (openaiKey && !openaiKey.includes("...")) {
      currentProfile.openai_key = openaiKey.substring(0, 4) + "..." + openaiKey.substring(openaiKey.length - 4);
    }
    if (geminiKey && !geminiKey.includes("...")) {
      currentProfile.gemini_key = geminiKey.substring(0, 4) + "..." + geminiKey.substring(geminiKey.length - 4);
    }
    
    updateProfileUI(currentProfile, provider !== "local");
    settingsMessage.style.color = "#10b981"; // Success color green
    settingsMessage.textContent = "Settings saved successfully!";
    
    setTimeout(() => {
      closeSettings();
    }, 800);
  } else {
    settingsMessage.style.color = "#f43f5e"; // Error color red
    settingsMessage.textContent = data.message;
  }
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
      updateProfileUI(currentProfile, data.ai_enabled || false);
      loadHistory();
    }
  }
};