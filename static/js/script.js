function sendMessage() {
    const inputBox = document.getElementById("user-input");
    const message = inputBox.value.trim();
    if (message === "") return;

    // Display user message
    displayMessage(message, "user-message");

    // Clear input
    inputBox.value = "";

    // Mock bot reply (later replace kar denge by backend API)
    setTimeout(() => {
        let botReply = "I am still learning! 🤖";
        if (message.toLowerCase().includes("hello")) {
            botReply = "Hello! How can I help you today?";
        }
        displayMessage(botReply, "bot-message");
    }, 600);
}

function displayMessage(text, className) {
    const chatBox = document.getElementById("chat-box");
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", className);
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
