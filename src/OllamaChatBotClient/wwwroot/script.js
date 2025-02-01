let currentChatId = null;
let chats = JSON.parse(localStorage.getItem("chats")) || {};
let controller = null; // AbortController for canceling requests
let uploadedFiles = []; // Stores uploaded files

document.addEventListener("DOMContentLoaded", function () {
    loadChatList();

    if (Object.keys(chats).length > 0) {
        const lastChatId = Object.keys(chats)[0];
        loadChat(lastChatId);
    }

    // ✅ Ensure elements exist before enabling resizing
    setTimeout(enableResizing, 100);
});

function enableResizing() {
    const sidebar = document.getElementById("sidebar");
    const resizer = document.getElementById("resizer");

    // ✅ Check if elements exist
    if (!sidebar || !resizer) {
        console.error("Sidebar or resizer not found!");
        return;
    }

    let isResizing = false;

    resizer.addEventListener("mousedown", function (event) {
        isResizing = true;
        document.addEventListener("mousemove", resizeSidebar);
        document.addEventListener("mouseup", stopResizing);
    });

    function resizeSidebar(event) {
        if (!isResizing) return;

        let newWidth = event.clientX;
        if (newWidth < 150) newWidth = 150; // Min width
        if (newWidth > 400) newWidth = 400; // Max width

        sidebar.style.width = `${newWidth}px`;
    }

    function stopResizing() {
        isResizing = false;
        document.removeEventListener("mousemove", resizeSidebar);
        document.removeEventListener("mouseup", stopResizing);
    }
}


// Handles file selection
function handleFileUpload(event) {
    const files = event.target.files;
    for (let file of files) {
        uploadedFiles.push(file); // Store actual File object
    }
    updateFileList();
}

// Updates file list in UI
function updateFileList() {
    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";
        fileItem.innerHTML = `
            <span>${file.name}</span>
            <span class="file-remove" onclick="removeFile(${index})">❌</span>
        `;
        fileList.appendChild(fileItem);
    });
}

// Removes a selected file
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFileList();
}

function startNewChat() {
    currentChatId = `chat_${Date.now()}`;
    chats[currentChatId] = [];
    saveChats();
    loadChatList();
    loadChat(currentChatId);
}

function loadChat(chatId) {
    currentChatId = chatId;
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";

    chats[chatId].forEach(message => {
        const msgElement = document.createElement("div");
        msgElement.className = `chat-message ${message.type}-message`;

        if (message.type === "bot") {

    
            var text = message.text;
        
            text = marked.parse(text);

            text = text.replace(/\[/g, '\\[').replace(/\]/g, '\\]');

            msgElement.innerHTML = text;
   
   

            // ✅ Ensure all code blocks are highlighted
            setTimeout(() => {
                msgElement.querySelectorAll("pre code").forEach(block => {
                    hljs.highlightElement(block);
                });
            }, 50);
        } else {
            msgElement.textContent = message.text; // User messages remain as text
        }

        chatBox.appendChild(msgElement);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
    MathJax.typeset(); // Re-render MathJax formulas
}

function loadChatList() {
    const chatList = document.getElementById("chatList");
    chatList.innerHTML = "";

    Object.keys(chats).forEach(chatId => {
        const chatItem = document.createElement("div");
        const text = chats[chatId][0]?.text || "New Chat";
        const firstThreeWords = text.split(/\s+/).slice(0, 3).join(" ");
        chatItem.className = "chat-item";
        chatItem.innerHTML = `<div onclick="loadChat('${chatId}')">
            <span>${firstThreeWords || "New Chat"}</span>
            <button class="delete-btn" onclick="deleteChat('${chatId}')">✖</button></div>
        `;
        chatList.appendChild(chatItem);
    });
}

function saveChats() {
    localStorage.setItem("chats", JSON.stringify(chats));
}

function deleteChat(chatId) {
    delete chats[chatId];
    saveChats();
    loadChatList();

    if (Object.keys(chats).length > 0) {
        loadChat(Object.keys(chats)[0]);
    } else {
        document.getElementById("chatBox").innerHTML = "";
        currentChatId = null;
    }
}

function deleteAllChats() {
    localStorage.removeItem("chats");
    chats = {};
    loadChatList();
    document.getElementById("chatBox").innerHTML = "";
    currentChatId = null;
}

// ✅ NEW: Cancel Generation Function
function cancelGeneration() {
    if (controller) {
        controller.abort();
        controller = null;
    }
    document.getElementById("cancelButton").style.display = "none";
    document.getElementById("sendButton").disabled = false;
}

async function sendMessage() {
    const userInput = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");
    const message = userInput.value.trim();

    if (!message && uploadedFiles.length === 0) return;

    if (!currentChatId) startNewChat();


    // ✅ Build conversation history
    let chatHistory = chats[currentChatId].map(msg => `${msg.type === "user" ? "User" : "Bot"}: ${msg.text}`).join("\n");


    let formData = new FormData();
    var promt = `Conversation so far:\n${chatHistory}\n\nUser: ${message}\nBot:`;
    formData.append("message", promt); // Add message

    // ✅ Ensure actual files are added
    uploadedFiles.forEach(file => {
        formData.append("files", file, file.name); // Append File object
    });

    const userMessage = { type: "user", text: message, files: uploadedFiles.map(f => f.name) };
    chats[currentChatId].push(userMessage);
    saveChats();
    loadChat(currentChatId);

    uploadedFiles = []; // Clear files after sending
    updateFileList();

    userInput.value = "";

    controller = new AbortController();
    const signal = controller.signal;

    document.getElementById("cancelButton").style.display = "inline-block";
    document.getElementById("sendButton").disabled = true;

    try {
        const response = await fetch("/api/ollama", {
            method: "POST",
            mode: "cors",
            body: formData, // Send FormData directly
            signal
        });

        if (!response.ok) throw new Error("Failed to connect to API");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let botMessage = { type: "bot", text: "" };
        chats[currentChatId].push(botMessage);
        saveChats();

        let botMessageElement = document.createElement("div");
        botMessageElement.className = "chat-message bot-message";
        chatBox.appendChild(botMessageElement);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });

            text.split("\n").forEach(line => {
                if (line.trim()) {
                    try {
                        const jsonResponse = JSON.parse(line);
                        if (jsonResponse.response) {
                            botMessage.text += jsonResponse.response;
                            botMessageElement.innerHTML += jsonResponse.response;
                            botMessageElement.innerHTML = botMessage.text;
                            botMessageElement.innerHTML = marked.parse(botMessageElement.innerHTML);
                          
                          
                            botMessageElement.querySelectorAll("pre code").forEach((block) => {
                                hljs.highlightElement(block);
                            });
                            //MathJax.typeset();
                        }
                    } catch (err) {
                        console.error("Error parsing JSON:", err);
                    }
                }
            });

            chatBox.scrollTop = chatBox.scrollHeight;
        }

        saveChats();
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Generation canceled.");
        } else {
            console.error("Error fetching response:", error);
        }
    } finally {

        botMessageElement.innerHTML = botMessageElement.innerHTML.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
        MathJax.typeset();
        document.getElementById("cancelButton").style.display = "none";
        document.getElementById("sendButton").disabled = false;
        controller = null;
    }
}

