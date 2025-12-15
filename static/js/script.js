const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");

// 🔊 Pop sound
const popSound = new Audio("../sounds/pop.wav");

// API endpoint
const API_URL = "/api/ask";

// 🔹 Play sound safely
function playPop() {
  popSound.currentTime = 0;
  popSound.play();
}

// 🔹 Add message to chat
function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.classList.add("message", type === "user" ? "user-message" : "bot-message");
  msg.innerHTML = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 🔹 Typing indicator
function showTyping() {
  const typing = document.createElement("div");
  typing.className = "typing-indicator";
  typing.id = "typingIndicator";
  typing.innerHTML = `<span></span><span></span><span></span>`;
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById("typingIndicator");
  if (typing) typing.remove();
}

// 🔹 Send message
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  playPop();
  addMessage(message, "user");
  userInput.value = "";

  showTyping();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message })
    });

    const data = await response.json();

    removeTyping();
    playPop();
    addMessage(data.answer, "bot");

  } catch (error) {
    removeTyping();
    addMessage("⚠️ Unable to connect to server.", "bot");
  }
}

// 🔹 ENTER to send (Shift+Enter = new line)
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
