const inputBox = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const popSound = new Audio("/static/sounds/pop.wav");

async function sendMessage() {
    const message = inputBox.value.trim();
    if (message === "") return;

    displayMessage(message, "user-message");
    inputBox.value = "";
    // popSound.play();

    // Create typing animation
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "bot-message");
    typingDiv.innerHTML = `
        <div class="typing">
            <span></span><span></span><span></span>
        </div>
    `;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Simulate short delay (typing time)
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        const response = await fetch("/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ msg: message })
        });

        const data = await response.json();
        chatBox.removeChild(typingDiv);
        displayMessage(data.reply, "bot-message");
        popSound.play();
    } catch (error) {
        chatBox.removeChild(typingDiv);
        displayMessage("⚠️ Error: Couldn't connect to server.", "bot-message");
    }
}

function displayMessage(text, className) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", className);
    msgDiv.innerText = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
