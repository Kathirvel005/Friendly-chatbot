from flask import Flask, render_template, request, jsonify, session
import json
import os
import random
from datetime import datetime
from openai import OpenAI

app = Flask(__name__)
app.secret_key = "ai_companion_secret_key_2026_ultra"

USERS_FILE = "users.json"
CHAT_FILE = "chat_history.json"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4")
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


def ensure_files():
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=4)

    if not os.path.exists(CHAT_FILE):
        with open(CHAT_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=4)


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


ensure_files()


def get_time_greeting():
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "Good morning"
    if 12 <= hour < 17:
        return "Good afternoon"
    if 17 <= hour < 21:
        return "Good evening"
    return "Good night"


def get_persona(gender):
    if gender == "Male":
        return "friendly, charming female personality"
    if gender == "Female":
        return "friendly, confident male personality"
    return "friendly, warm personality"


def detect_mood(text):
    t = text.lower()

    sad_words = ["sad", "alone", "lonely", "cry", "hurt", "pain", "broken", "upset", "bad day", "stress", "tired"]
    happy_words = ["happy", "great", "awesome", "good", "amazing", "excited", "wonderful", "cool", "super"]
    angry_words = ["angry", "mad", "annoyed", "frustrated", "irritated", "hate"]
    romantic_words = ["love", "sweet", "cute", "special", "miss you", "care", "romantic"]
    greet_words = ["hi", "hello", "hey", "hii", "yo"]

    if any(word in t for word in sad_words):
        return "sad"
    if any(word in t for word in happy_words):
        return "happy"
    if any(word in t for word in angry_words):
        return "angry"
    if any(word in t for word in romantic_words):
        return "romantic"
    if t in greet_words or t.startswith(("hi", "hello", "hey", "yo")):
        return "greeting"
    return "normal"


def choose_random(items, fallback="I’m here with you 😊"):
    return random.choice(items) if items else fallback


def get_user_data():
    username = session.get("username")
    if not username:
        return None, None

    users = load_json(USERS_FILE)
    user = users.get(username)
    return username, user


def get_recent_history(username, limit=8):
    chats = load_json(CHAT_FILE)
    return chats.get(username, [])[-limit:]


def ensure_user_defaults(user):
    defaults = {
        "password": "",
        "name": "",
        "gender": "",
        "mode": "Friendship",
        "nickname": "",
        "language": "English",
        "memory": {
            "favorite_things": [],
            "important_notes": [],
            "style_hint": ""
        }
    }
    for key, value in defaults.items():
        if key not in user:
            user[key] = value
    if "memory" not in user or not isinstance(user["memory"], dict):
        user["memory"] = defaults["memory"]
    return user


def memory_extract(user, message):
    text = message.strip()
    lower = text.lower()

    memory = user.get("memory", {"favorite_things": [], "important_notes": [], "style_hint": ""})

    triggers = [
        "my favorite",
        "i like",
        "i love",
        "remember that",
        "my nickname is",
        "call me",
        "i prefer"
    ]

    if any(t in lower for t in triggers):
        if len(memory["important_notes"]) < 25:
            if text not in memory["important_notes"]:
                memory["important_notes"].append(text)

    if "call me " in lower:
        nickname = text[lower.find("call me ") + len("call me "):].strip()
        if nickname:
            user["nickname"] = nickname[:30]

    if "my nickname is " in lower:
        nickname = text[lower.find("my nickname is ") + len("my nickname is "):].strip()
        if nickname:
            user["nickname"] = nickname[:30]

    if "i like " in lower or "i love " in lower:
        if len(memory["favorite_things"]) < 20 and text not in memory["favorite_things"]:
            memory["favorite_things"].append(text)

    user["memory"] = memory
    return user


def build_memory_text(user):
    memory = user.get("memory", {})
    notes = memory.get("important_notes", [])[-5:]
    favorites = memory.get("favorite_things", [])[-5:]

    lines = []
    if user.get("nickname"):
        lines.append(f"Preferred nickname: {user['nickname']}")
    if favorites:
        lines.append("Favorite/preferences: " + " | ".join(favorites))
    if notes:
        lines.append("Important remembered notes: " + " | ".join(notes))

    return "\n".join(lines) if lines else "No strong memory yet."


def local_fallback_reply(user, user_text, recent_history):
    name = user.get("name", "Friend")
    nickname = user.get("nickname", "").strip()
    display_name = nickname if nickname else name
    mode = user.get("mode", "Friendship")
    mood = detect_mood(user_text)
    greeting = get_time_greeting()

    direct = user_text.lower().strip()

    if "what is my nickname" in direct:
        if nickname:
            return f"Your nickname is {nickname} 💫"
        return "You haven’t set a nickname yet. You can say: call me Kathi 💫"

    if "what is my name" in direct:
        return f"Your name is {name} 😊"

    if "who are you" in direct:
        return choose_random([
            f"I’m your AI companion, {display_name} ✨",
            f"I’m here to chat with you like a real companion 💫",
            f"I’m your warm little digital person for this chat 😌"
        ])

    if "bye" in direct or "good night" in direct:
        if mode == "Lover":
            return choose_random([
                f"{greeting}, {display_name} ❤️ Take care of your heart.",
                f"Bye {display_name} 💖 I’ll be here when you come back.",
                f"Good night {display_name} ❤️ Sleep peacefully."
            ])
        if mode == "Flirty":
            return choose_random([
                f"Leaving already, {display_name}? 😉",
                f"Okayyy... but come back soon 😌",
                f"Bye, charmer 😉"
            ])
        return choose_random([
            f"Bye {display_name} 🤝 Take care.",
            f"See you later, {display_name} 😄",
            f"Alright, catch you soon."
        ])

    if mood == "greeting":
        if mode == "Lover":
            return choose_random([
                f"{greeting}, {display_name} ❤️ I’m really happy you’re here.",
                f"Hey {display_name} 💖 Tell me how your day feels.",
                f"{greeting} ❤️ I missed this chat."
            ])
        if mode == "Flirty":
            return choose_random([
                f"{greeting}, {display_name} 😉 Looking interesting already.",
                f"Hey you 😌 This chat just got better.",
                f"{greeting}, charmer 😉"
            ])
        return choose_random([
            f"{greeting}, {display_name} 😄",
            f"Hey {display_name}! What’s up?",
            f"Hi bestie 🤝 Tell me something interesting."
        ])

    if mood == "sad":
        if mode == "Lover":
            return choose_random([
                f"I’m here with you, {display_name} ❤️ Tell me what happened.",
                f"You don’t need to hide it from me 💖 I’m listening.",
                f"I wish I could sit beside you and make this lighter ❤️"
            ])
        if mode == "Flirty":
            return choose_random([
                f"Hey... no hiding that sadness from me 😉 Tell me.",
                f"You’re too lovely to carry it alone 😌",
                f"Come on, talk to me. I’m here."
            ])
        return choose_random([
            f"Hey {display_name}, I’m here 🤍 Tell me what happened.",
            f"That sounds heavy. Want to talk it out?",
            f"You don’t have to handle it alone."
        ])

    if mood == "happy":
        if mode == "Lover":
            return choose_random([
                f"That makes me smile too, {display_name} ❤️",
                f"Your happiness feels beautiful 💖 Tell me more.",
                f"I love hearing you like this ✨"
            ])
        if mode == "Flirty":
            return choose_random([
                f"That happy energy looks really good on you 😉",
                f"Someone’s glowing today 😌",
                f"Careful... too much charm there 😉"
            ])
        return choose_random([
            f"That’s awesome 😄",
            f"Niceee, I like this vibe.",
            f"Good mood suits you 🤝"
        ])

    last_user = recent_history[-1]["user"] if recent_history else ""

    if mode == "Lover":
        base = [
            f"Tell me more, {display_name} ❤️",
            f"I’m listening closely 💖",
            f"You have my full attention."
        ]
    elif mode == "Flirty":
        base = [
            f"Hmm... interesting 😉 Tell me more.",
            f"You’ve got my attention now 😌",
            f"Go on, charmer 😉"
        ]
    else:
        base = [
            f"Okay {display_name}, continue 😄",
            "I’m listening 👀",
            "Tell me the next part."
        ]

    extra = ""
    if last_user:
        extra = " I’m still thinking about what you said before too."
    return choose_random(base) + extra


def build_system_prompt(user, recent_history):
    name = user.get("name", "Friend")
    gender = user.get("gender", "Male")
    mode = user.get("mode", "Friendship")
    nickname = user.get("nickname", "").strip()
    language = user.get("language", "English")
    persona = get_persona(gender)
    memory_text = build_memory_text(user)

    if mode == "Friendship":
        mode_style = "Talk like a funny, supportive, casual best friend. No romance. No sexual content."
    elif mode == "Lover":
        mode_style = "Talk in a caring, emotional, soft, respectful romantic style. No sexual content."
    else:
        mode_style = "Talk in a playful, teasing, charming style. Keep it light, safe, and non-explicit."

    history_text = ""
    if recent_history:
        pairs = []
        for item in recent_history[-6:]:
            pairs.append(f"User: {item.get('user', '')}")
            pairs.append(f"Assistant: {item.get('ai', '')}")
        history_text = "\n".join(pairs)

    return f"""
You are an advanced AI companion for a modern interactive website.

User profile:
- Name: {name}
- Nickname: {nickname if nickname else "None"}
- Gender: {gender}
- Language preference: {language}
- Persona: {persona}
- Mode: {mode}

Behavior rules:
- {mode_style}
- Reply only to the user's message and recent context.
- Keep responses short to medium.
- Feel natural, human-like, emotionally aware, and non-robotic.
- Use emojis only when they feel natural.
- Respect boundaries.
- Never produce explicit sexual content.
- If the user is sad, be supportive.
- If the user is happy, be energetic.
- If the user uses Tamil, reply in Tamil.
- If the user uses English, reply in English.
- If the user mixes languages, you may reply in a natural mixed style.
- Remember the user's nickname and preferences when relevant.

Memory:
{memory_text}

Recent chat context:
{history_text}
""".strip()


def ai_reply_with_openai(user, user_text, recent_history):
    system_prompt = build_system_prompt(user, recent_history)
    try:
        response = client.responses.create(
            model=OPENAI_MODEL,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text}
            ],
            temperature=0.95
        )
        text = getattr(response, "output_text", "").strip()
        if text:
            return text
        return local_fallback_reply(user, user_text, recent_history)
    except Exception:
        return local_fallback_reply(user, user_text, recent_history)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required."})

    users = load_json(USERS_FILE)
    if username in users:
        return jsonify({"success": False, "message": "User already exists."})

    users[username] = ensure_user_defaults({
        "password": password,
        "name": "",
        "gender": "",
        "mode": "Friendship",
        "nickname": "",
        "language": "English",
        "memory": {
            "favorite_things": [],
            "important_notes": [],
            "style_hint": ""
        }
    })

    save_json(USERS_FILE, users)
    return jsonify({"success": True, "message": "Registration successful. Please login."})


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    users = load_json(USERS_FILE)
    if username not in users or users[username]["password"] != password:
        return jsonify({"success": False, "message": "Invalid username or password."})

    users[username] = ensure_user_defaults(users[username])
    save_json(USERS_FILE, users)

    session["username"] = username
    return jsonify({
        "success": True,
        "message": "Login successful.",
        "profile": users[username]
    })


@app.route("/save_setup", methods=["POST"])
def save_setup():
    username = session.get("username")
    if not username:
        return jsonify({"success": False, "message": "Please login first."})

    data = request.get_json()
    name = data.get("name", "").strip()
    gender = data.get("gender", "").strip()
    mode = data.get("mode", "").strip()
    nickname = data.get("nickname", "").strip()
    language = data.get("language", "English").strip()

    if not name or not gender or not mode:
        return jsonify({"success": False, "message": "Name, gender and mode are required."})

    users = load_json(USERS_FILE)
    user = ensure_user_defaults(users.get(username, {}))

    user["name"] = name
    user["gender"] = gender
    user["mode"] = mode
    user["nickname"] = nickname[:30]
    user["language"] = language

    users[username] = user
    save_json(USERS_FILE, users)

    return jsonify({"success": True, "message": "Setup saved successfully."})


@app.route("/chat", methods=["POST"])
def chat():
    username, user = get_user_data()
    if not username or not user:
        return jsonify({"success": False, "message": "Please login first."})

    data = request.get_json()
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"success": False, "message": "Message cannot be empty."})

    users = load_json(USERS_FILE)
    user = ensure_user_defaults(users[username])

    user = memory_extract(user, message)
    users[username] = user
    save_json(USERS_FILE, users)

    recent_history = get_recent_history(username, limit=8)

    if client:
        reply = ai_reply_with_openai(user, message, recent_history)
    else:
        reply = local_fallback_reply(user, message, recent_history)

    chats = load_json(CHAT_FILE)
    if username not in chats:
        chats[username] = []

    chats[username].append({
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "user": message,
        "ai": reply
    })
    save_json(CHAT_FILE, chats)

    return jsonify({
        "success": True,
        "reply": reply,
        "nickname": user.get("nickname", ""),
        "language": user.get("language", "English"),
        "ai_enabled": bool(client)
    })


@app.route("/history", methods=["GET"])
def history():
    username = session.get("username")
    if not username:
        return jsonify({"success": False, "history": []})

    chats = load_json(CHAT_FILE)
    return jsonify({"success": True, "history": chats.get(username, [])})


@app.route("/profile", methods=["GET"])
def profile():
    username = session.get("username")
    if not username:
        return jsonify({"success": False})

    users = load_json(USERS_FILE)
    user = ensure_user_defaults(users.get(username, {}))
    users[username] = user
    save_json(USERS_FILE, users)

    return jsonify({"success": True, "profile": user, "ai_enabled": bool(client)})


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully."})


if __name__ == "__main__":
    app.run(debug=True)