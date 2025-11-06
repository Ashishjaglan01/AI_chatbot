const inputBox = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-btn");
const popSound = new Audio("/static/sounds/pop.wav");

// helper: disable/enable input and send button
function setControlsDisabled(disabled = true) {
    if (inputBox) inputBox.disabled = disabled;
    if (sendBtn) sendBtn.disabled = disabled;
    if (sendBtn) sendBtn.style.opacity = disabled ? "0.6" : "1";
}

async function sendMessage() {
    const message = inputBox.value.replace(/\r/g, "").trim();
    if (message === "") return;

    displayMessage(message, "user-message");
    inputBox.value = "";

    // disable controls while waiting
    setControlsDisabled(true);

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
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const response = await fetch("/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ msg: message })
        });

        const data = await response.json();
        chatBox.removeChild(typingDiv);

        // Render bot HTML reply (links etc.)
        displayMessage(data.reply, "bot-message", true);

        // Play sound AFTER bot message appears
        try { popSound.currentTime = 0; await popSound.play(); } catch(e){}
    } catch (error) {
        chatBox.removeChild(typingDiv);
        displayMessage("⚠️ Error: Couldn't connect to server.", "bot-message");
    } finally {
        // re-enable controls
        setControlsDisabled(false);
        inputBox.focus();
    }
}

/**
 * displayMessage
 */
function displayMessage(text, className, isHTML = false) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", className);

    if (isHTML) msgDiv.innerHTML = text;
    else msgDiv.innerText = text;

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}


inputBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        if (event.shiftKey) {
            // Insert a newline at caret position
            const start = inputBox.selectionStart;
            const end = inputBox.selectionEnd;
            const value = inputBox.value;
            inputBox.value = value.slice(0, start) + "\n" + value.slice(end);
            // move caret to after the newline
            inputBox.selectionStart = inputBox.selectionEnd = start + 1;
            // allow default (no prevent) — but prevent to avoid form submit behavior
            event.preventDefault();
        } else {
            // Enter (without shift) => send
            event.preventDefault();
            // If controls disabled, ignore
            if (inputBox.disabled || (sendBtn && sendBtn.disabled)) return;
            sendMessage();
        }
    }
});

/* make textarea auto-resize as user types (nice polish) */
inputBox.addEventListener("input", function () {
    this.style.height = "auto";
    const max = 140; // px
    this.style.height = Math.min(this.scrollHeight, max) + "px";
});
s