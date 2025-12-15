// ---------------- DOM ELEMENTS ----------------
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");

// ---------------- CONFIG ----------------
// IMPORTANT: use RELATIVE URL (frontend is served by Flask)
const API_URL = "/api/ask";

// Pop sound
const popSound = new Audio("../sounds/pop.wav");

// ---------------- UTILS ----------------
function playPop() {
  popSound.currentTime = 0;
  popSound.play().catch(() => {}); // ignore autoplay issues
}

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ---------------- MESSAGE RENDER ----------------
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message");

  if (sender === "user") {
    msg.classList.add("user-message");
    msg.textContent = text;
  } else {
    msg.classList.add("bot-message");
    msg.innerHTML = text; // allow links & formatting
  }

  chatBox.appendChild(msg);
  scrollToBottom();
}

// ---------------- TYPING INDICATOR ----------------
function showTyping() {
  const typing = document.createElement("div");
  typing.className = "typing-indicator";
  typing.id = "typingIndicator";
  typing.innerHTML = "<span></span><span></span><span></span>";
  chatBox.appendChild(typing);
  scrollToBottom();
}

function removeTyping() {
  const typing = document.getElementById("typingIndicator");
  if (typing) typing.remove();
}

// ---------------- SEND MESSAGE ----------------
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // User message
  playPop();
  addMessage(message, "user");
  userInput.value = "";

  // Bot typing
  showTyping();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message })
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    removeTyping();
    playPop();
    addMessage(data.answer, "bot");

  } catch (error) {
    removeTyping();
    addMessage("⚠️ Unable to connect to server.", "bot");
  }
}

// ---------------- ENTER KEY HANDLING ----------------
// Enter → send
// Shift + Enter → new line
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ---------------- AUTO RESIZE TEXTAREA ----------------
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = userInput.scrollHeight + "px";
});
