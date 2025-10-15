// Load sound
const botSound = new Audio("/static/sounds/pop.wav");


function sendMessage() {
    const inputBox = document.getElementById("user-input");
    const message = inputBox.value.trim();
    if (message === "") return;

    displayMessage(message, "user-message");
    inputBox.value = "";

    showTypingIndicator();

    setTimeout(() => {
        hideTypingIndicator();

        let botReply = "🤖 I’m still learning! Try asking about notes or quizzes.";
        if (message.toLowerCase().includes("hello")) {
            botReply = "Hello 👋! I’m your college chatbot assistant. How can I help?";
        } else if (message.toLowerCase().includes("notes")) {
            botReply = "📘 You can access your subject notes here soon!";
        } else if (message.toLowerCase().includes("quiz")) {
            botReply = "🧠 Quiz feature coming soon!";
        }

        displayMessage(botReply, "bot-message");
        botSound.play().catch(error => console.log("Audio play blocked:", error));
     }, 600);
}

// Typewriter effect (bot message)
function typeMessage(text, className) {
    const chatBox = document.getElementById("chat-box");
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", className);
    chatBox.appendChild(msgDiv);

    let index = 0;
    const typingSpeed = 25;

    const typingInterval = setInterval(() => {
        msgDiv.textContent += text[index];
        index++;
        chatBox.scrollTop = chatBox.scrollHeight;
        if (index >= text.length) {
            clearInterval(typingInterval);
        }
    }, typingSpeed);
}

function displayMessage(text, className) {
    const chatBox = document.getElementById("chat-box");
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", className);
    msgDiv.textContent = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

//Typing Indicator 
function showTypingIndicator() {
    const chatBox = document.getElementById("chat-box");
    const indicator = document.createElement("div");
    indicator.classList.add("typing-indicator");
    indicator.innerHTML = "<span></span><span></span><span></span>";
    indicator.id = "typing-indicator";
    chatBox.appendChild(indicator);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) indicator.remove();
}

// Sound Function 
function playBotSound() {
    if (botSound) {
        botSound.currentTime = 0;
        botSound.play().catch(() => {}); // ignore autoplay restrictions
    }
}
