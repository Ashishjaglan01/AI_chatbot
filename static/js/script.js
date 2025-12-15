// GLOBALS
let currentSessionId = null;

const inputBox   = document.getElementById("user-input");
const chatBox    = document.getElementById("chat-box");
const chatList   = document.getElementById("chat-list");
const sendBtn    = document.getElementById("send-btn");
const titleInput = document.getElementById("edit-chat-title");
const sidebar    = document.getElementById("sidebar");
const overlay    = document.getElementById("overlay");

const popSound   = new Audio("/static/sounds/pop.wav");

// disable input temporarily
function setControlsDisabled(disabled = true) {
    if (inputBox) inputBox.disabled = disabled;
    if (sendBtn) {
        sendBtn.disabled = disabled;
        sendBtn.style.opacity = disabled ? "0.6" : "1";
    }
}


// INITIAL LOAD
window.onload = async () => {
    // overlay click closes sidebar + menus
    if (overlay) {
        overlay.addEventListener("click", () => {
            closeSidebar();
            closeAllMenus();
        });
    }

    // If desktop width on initial load, ensure sidebar visible
    if (sidebar && window.innerWidth > 880) {
        sidebar.classList.remove("sidebar-hidden");
        if (overlay) overlay.classList.remove("active");
    }

    await loadChatList();
    await startNewChat();
};

// SIDEBAR + MENU HELPERS
function closeAllMenus() {
    document.querySelectorAll(".chat-menu").forEach(m => m.style.display = "none");
}

function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove("sidebar-hidden");
    overlay?.classList.add("active");
}

function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.add("sidebar-hidden");
    overlay?.classList.remove("active");
}

function toggleSidebar() {
    if (!sidebar) return;

    const isHidden = sidebar.classList.toggle("sidebar-hidden");

    if (isHidden) overlay?.classList.remove("active");
    else overlay?.classList.add("active");
}

// LOAD CHAT LIST
async function loadChatList() {
    try {
        const res = await fetch("/get_chats");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const chats = await res.json();

        if (!chatList) return;
        chatList.innerHTML = "";

        if (!Array.isArray(chats) || chats.length === 0) {
            chatList.innerHTML = `<li class="no-chats">No chats yet — click + New to start</li>`;
            return;
        }

        chats.forEach(chat => {
            const item = document.createElement("li");
            item.classList.add("chat-item");
            item.dataset.id = chat.session_id;

            item.innerHTML = `
                <span class="chat-title">${chat.title}</span>

                <div class="chat-menu-container">
                    <span class="chat-menu-btn">⋮</span>

                    <div class="chat-menu" id="menu-${chat.session_id}">
                        <button onclick="renameChat('${chat.session_id}')">Rename</button>
                        <button class="delete-option" onclick="deleteChat(event, '${chat.session_id}')">Delete</button>
                    </div>
                </div>
            `;

            // Load chat on clicking entire item
            item.addEventListener("click", async () => {
                await loadChat(chat.session_id);

                // on mobile → close sidebar
                if (window.innerWidth < 880) closeSidebar();
            });

            // open menu on clicking ⋮
            const menuBtn = item.querySelector(".chat-menu-btn");
            if (menuBtn) {
                menuBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    openChatMenu(e, chat.session_id);
                });
            }

            chatList.appendChild(item);
        });

        highlightActiveChat(currentSessionId);
    } catch (err) {
        console.error("loadChatList error:", err);
        if (chatList) {
            chatList.innerHTML = "";
            const li = document.createElement("li");
            li.className = "no-chats";
            li.style.color = "#ff6b6b";
            li.innerText = "Unable to load chats — check server console.";
            chatList.appendChild(li);
        }
    } finally {
        closeAllMenus();
    }
}


// OPEN ⋮ MENU
function openChatMenu(event, sessionId) {
    event.stopPropagation();
    closeAllMenus(); // close others first

    const menu = document.getElementById(`menu-${sessionId}`);
    if (!menu) return;

    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";

    if (!isOpen) {
        const handleOutsideClick = (e) => {
            if (!menu.contains(e.target)) {
                menu.style.display = "none";
                document.removeEventListener("click", handleOutsideClick);
            }
        };
        // small timeout so the click that opened the menu doesn't immediately trigger close
        setTimeout(() => document.addEventListener("click", handleOutsideClick), 10);
    }
}


// CREATE NEW CHAT
async function startNewChat() {
    try {
        const res = await fetch("/new_chat", { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        currentSessionId = data.session_id;

        if (chatBox) chatBox.innerHTML = "";
        if (titleInput) titleInput.value = "New Chat";

        await loadChatList();
        highlightActiveChat(currentSessionId);

        if (window.innerWidth < 880) closeSidebar();
    } catch (err) {
        console.error("startNewChat error:", err);
        alert("Unable to create a new chat — check server.");
    }
}


// HIGHLIGHT ACTIVE CHAT
function highlightActiveChat(sessionId) {
    document.querySelectorAll(".chat-item").forEach(item => {
        item.classList.toggle("active", item.dataset.id === sessionId);
    });
}
// LOAD CHAT MESSAGES
async function loadChat(sessionId) {
    try {
        currentSessionId = sessionId;

        const res = await fetch(`/get_messages/${sessionId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const messages = await res.json();

        if (chatBox) {
            chatBox.innerHTML = "";

            messages.forEach(m =>
                displayMessage(m.message, m.sender === "user" ? "user-message" : "bot-message", true)
            );

            chatBox.scrollTop = chatBox.scrollHeight;
        }

        highlightActiveChat(sessionId);

        // update editable title box
        const item = document.querySelector(`li[data-id='${sessionId}'] .chat-title`);
        if (item && titleInput) titleInput.value = item.innerText.trim();

        if (window.innerWidth < 880) closeSidebar();
    } catch (err) {
        console.error("loadChat error:", err);
        alert("Failed to load chat messages — check server.");
    }
}

// SEND MESSAGE
async function sendMessage() {
    if (!inputBox) return;
    const message = inputBox.value.trim();
    if (!message) return;

    displayMessage(message, "user-message");
    inputBox.value = "";
    autoResize();

    await saveMessage(currentSessionId, "user", message);

    setControlsDisabled(true);

    // typing bubble
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "bot-message");
    typingDiv.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
    if (chatBox) {
        chatBox.appendChild(typingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    await new Promise(r => setTimeout(r, 900));

    try {
        const res = await fetch("/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ msg: message, session_id: currentSessionId })
        });

        const data = await res.json();
        if (chatBox && chatBox.contains(typingDiv)) chatBox.removeChild(typingDiv);

        displayMessage(data.reply, "bot-message", true);

        try { popSound.currentTime = 0; popSound.play(); } catch {}

        await saveMessage(currentSessionId, "bot", data.reply);
        await loadChatList();

    } catch (err) {
        if (chatBox && chatBox.contains(typingDiv)) chatBox.removeChild(typingDiv);
        console.error("sendMessage error:", err);
        displayMessage("⚠️ Error: Could not connect to server.", "bot-message");
    }

    setControlsDisabled(false);
    if (inputBox) inputBox.focus();
}


// SAVE MESSAGE TO DB
async function saveMessage(sessionId, sender, message) {
    try {
        await fetch("/save_message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId, sender, message })
        });
    } catch (err) {
        console.error("saveMessage error:", err);
    }
}


// DISPLAY MESSAGE

function displayMessage(text, className, isHTML = false) {
    if (!chatBox) return;
    const div = document.createElement("div");
    div.classList.add("message", className);

    div.innerHTML = isHTML ? text : text.replace(/\n/g, "<br>");
    chatBox.appendChild(div);

    chatBox.scrollTop = chatBox.scrollHeight;
}

// DELETE CHAT

async function deleteChat(event, sessionId) {
    event.stopPropagation();

    if (!confirm("Delete this chat?")) return;

    await fetch(`/delete_chat/${sessionId}`, { method: "DELETE" });

    await loadChatList();

    if (sessionId === currentSessionId) startNewChat();
    closeAllMenus();
}

// RENAME CHAT

async function renameChat(sessionId) {
    const newTitle = prompt("Enter new chat title:");
    if (!newTitle) return;

    await fetch("/rename_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, title: newTitle })
    });

    await loadChatList();

    if (sessionId === currentSessionId && titleInput) titleInput.value = newTitle;
    closeAllMenus();
}

// THEME TOGGLE

function toggleTheme() {
    document.body.classList.toggle("light-theme");
}
// EXPORT CHAT TO PDF

async function exportChatToPDF() {
    try {
        const res = await fetch(`/export_pdf/${currentSessionId}`);
        const data = await res.json();

        const link = document.createElement("a");
        link.href = data.file;
        link.download = "LearnMate_Chat.pdf";
        link.click();

        showToast("PDF Exported!");
    } catch (err) {
        console.error("exportChatToPDF error:", err);
        showToast("Failed to export PDF");
    }
}

// TOAST

function showToast(msg) {
    const div = document.createElement("div");
    div.classList.add("export-toast");
    div.innerText = msg;
    document.body.appendChild(div);

    setTimeout(() => div.remove(), 2000);
}

// AUTO RESIZE

function autoResize() {
    if (!inputBox) return;
    inputBox.style.height = "auto";
    inputBox.style.height = Math.min(inputBox.scrollHeight, 140) + "px";
}

inputBox?.addEventListener("input", autoResize);


// ENTER KEY HANDLING

inputBox?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        if (!event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }
});


// RESIZE LOGIC FOR DESKTOP ↔ MOBILE

window.addEventListener("resize", () => {
    if (!sidebar || !overlay) return;
    if (window.innerWidth > 880) {
        sidebar.classList.remove("sidebar-hidden");
        overlay.classList.remove("active");
        closeAllMenus();
    }
});
