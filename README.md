# 🤖 AI Companion Ultra

A modern **AI companion web application** designed for single users with **real-person style chatting**, emotional intelligence, memory, and multilingual voice interaction.

---

## ✨ Features

* 🧠 **Memory-based AI** (remembers user preferences & nickname)
* 💬 **Human-like conversation** (adaptive + random replies)
* ❤️ **3 Chat Modes**

  * Friendship Mode 🤝
  * Lover Mode ❤️
  * Flirty Mode 😉
* 🕒 **Time-based greetings** (morning / afternoon / evening / night)
* 🧑‍🤝‍🧑 **Nickname system** (AI remembers how to call you)
* 🌐 **Multilingual support**

  * English 🇬🇧
  * Tamil 🇮🇳
  * Mixed mode
* 🎤 **Voice Input + Voice Reply**
* 🎨 **Dark / Light Theme UI**
* 💾 **Chat history saving**
* 🔐 **Login & Register system**
* ⚡ **Real AI API integration (optional)**

---

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Python (Flask)
* **Database:** JSON (can upgrade to SQLite)
* **AI:**

  * Local smart reply engine
  * OpenAI API (optional)

---

## 📁 Project Structure

```
ai-companion-v2/
│
├── app.py
├── users.json
├── chat_history.json
├── requirements.txt
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js
```

---

## 🚀 How to Run

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/ai-companion-ultra.git
cd ai-companion-ultra
```

---

### 2️⃣ Create virtual environment

```bash
python -m venv venv
```

---

### 3️⃣ Activate environment

**Windows (CMD):**

```bash
venv\Scripts\activate
```

**PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

If error:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

---

### 4️⃣ Install dependencies

```bash
pip install -r requirements.txt
```

---

### 5️⃣ Run the project

```bash
python app.py
```

---

### 6️⃣ Open in browser

```
http://127.0.0.1:5000
```

---

## 🔑 Optional: Enable Real AI

Set your OpenAI API key:

**CMD:**

```bash
set OPENAI_API_KEY=your_api_key_here
```

**PowerShell:**

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
```

Then run:

```bash
python app.py
```

---

## 💡 How It Works

1. User logs in / registers
2. Sets:

   * Name
   * Gender
   * Mode
   * Language
3. AI adapts personality:

   * Male → Female-style AI
   * Female → Male-style AI
4. AI responds based on:

   * Mood detection
   * Previous messages
   * Memory
   * Selected mode

---

## 📸 UI Highlights

* Glassmorphism design
* Mobile responsive
* Chat bubble interface
* Sidebar controls
* Voice interaction

---

## 🔥 Future Improvements

* 🗄️ SQLite / Database upgrade
* 📱 Android app version
* 🧠 Advanced long-term memory
* 🎭 Emotion detection AI
* 🧑‍💻 Profile customization
* 🌍 More languages support

---

## 👨‍💻 Author

**Kathirvel T**
AI Developer | Python Programmer | Robotics Enthusiast

🔗 GitHub: https://github.com/Kathirvel005
🔗 LinkedIn: https://www.linkedin.com/in/kathirvel2407

---

## ⭐ Support

If you like this project:
👉 Give it a ⭐ on GitHub
👉 Share with your friends

---

## ⚠️ Disclaimer

This project is for **educational and personal use only**.
All conversations are designed to be **safe, respectful, and non-harmful**.

---

💖 *Built with passion to create a smart and emotional AI experience.*
