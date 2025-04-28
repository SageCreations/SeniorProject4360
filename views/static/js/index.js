// Globals ====================================================================
let file_list = [];
let current_hist = -1; // -1 by default, backend will create new history if -1.

document.addEventListener('DOMContentLoaded', function () {
    // DOM is loaded. Check if `webui` object is available
    if (typeof webui !== 'undefined') {
        // Set events callback
        webui.setEventCallback((e) => {
            if (e == webui.event.CONNECTED) {
                // Connection to the backend is established
                console.log('WebUI Connected.');
                current_hist = -1;
                initSidebar();
                getAPIKey();

            } else if (e == webui.event.DISCONNECTED) {
                // Connection to the backend is lost
                console.log('WebUI Disconnected.');
            }
        });
    } else {
        // The virtual file `webui.js` is not included
        alert('Please add webui.js to your HTML.');
    }
    const inputField = document.getElementById('chatInput');
    inputField.addEventListener('keypress', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent adding a newline
            handleQuery();          // Call existing send function
        }
    });
});



// Trigger file input when docBtn is clicked
document.getElementById('docBtn').addEventListener('click', function () {
    document.getElementById('fileInput').click();
});

// Handle file selection and update the UI
document.getElementById('fileInput').addEventListener('change', function (e) {
    const files = e.target.files;
    const preview = document.getElementById('filePreview');
    preview.innerHTML = ''; // Clear previous previews

    if (files.length > 0) {
        Array.from(files).forEach(file => {
            const fileItem = document.createElement('div');

            // add file to file_list for sending to the backend later
            const reader = new FileReader();
            reader.onload = function () {
                const dataURL = reader.result;

                if (file.type.startsWith('image/')) {
                    const img = new Image();
                    img.onload = function () {
                        const width = img.naturalWidth;
                        const height = img.naturalHeight;
                        const augmentedData = `${dataURL},${width},${height}`;
                        file_list.push(augmentedData);
                    };
                    img.src = dataURL;

                } else {
                    file_list.push(dataURL);
                }
            };
            reader.readAsDataURL(file);

            // Check file type and display appropriate preview
            if (file.type.startsWith('image/')) {
                const preview_reader = new FileReader();
                preview_reader.onload = function (event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.classList.add('preview-img');
                    fileItem.appendChild(img);
                };
                preview_reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                // Create a PDF icon using inline SVG inside a styled container
                const pdfContainer = document.createElement('div');
                pdfContainer.classList.add('pdf-icon');
                pdfContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-filetype-pdf" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM1.6 11.85H0v3.999h.791v-1.342h.803q.43 0 .732-.173.305-.175.463-.474a1.4 1.4 0 0 0 .161-.677q0-.375-.158-.677a1.2 1.2 0 0 0-.46-.477q-.3-.18-.732-.179m.545 1.333a.8.8 0 0 1-.085.38.57.57 0 0 1-.238.241.8.8 0 0 1-.375.082H.788V12.48h.66q.327 0 .512.181.185.183.185.522m1.217-1.333v3.999h1.46q.602 0 .998-.237a1.45 1.45 0 0 0 .595-.689q.196-.45.196-1.084 0-.63-.196-1.075a1.43 1.43 0 0 0-.589-.68q-.396-.234-1.005-.234zm.791.645h.563q.371 0 .609.152a.9.9 0 0 1 .354.454q.118.302.118.753a2.3 2.3 0 0 1-.068.592 1.1 1.1 0 0 1-.196.422.8.8 0 0 1-.334.252 1.3 1.3 0 0 1-.483.082h-.563zm3.743 1.763v1.591h-.79V11.85h2.548v.653H7.896v1.117h1.606v.638z"/>
                    </svg>`;
                fileItem.appendChild(pdfContainer);
            }
            preview.appendChild(fileItem);
        });
        // Show the slide-out preview panel
        preview.classList.add('active');
    } else {
        preview.classList.remove('active');
    }
});



// Main input handle from user ================================================
async function handleQuery() {
    let input_field = document.getElementById('chatInput');
    let query = input_field.value;

    // Get the file input element and its files
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files; // This is a FileList object

    addUserMessage(query, files);

    // remove file preview
    const preview = document.getElementById('filePreview');
    preview.classList.remove('active');

    // clear preview and file input for next message
    fileInput.value = '';
    preview.innerHTML = '';

    // Clear the input field
    input_field.value = '';

    let submit_btn = document.getElementById('chatBtn');
    submit_btn.disabled = true;

    // Add a bot placeholder message
    const placeholder = addBotPlaceholderMessage();

    webui.handleChat(current_hist, query, file_list.join('|')).then(resp => {
        placeholder.remove();
        const parts = resp.split("|");
        if (current_hist === -1) {
            webui.getTitle(parseInt(parts[0], 10)).then(resp => {
                // title change
                document.getElementById('chatTitle').innerText = resp;
                // add a button to sidebar
                addSidebarButton(parseInt(parts[0], 10), resp)
            });

        }
        current_hist = parseInt(parts[0], 10);

        // Get the remainder as a string.
        const bot_resp = parts.slice(1).join("|");

        addBotMessage(bot_resp);
        submit_btn.disabled = false;
        file_list = [];
    }).catch(error => {
        console.error(error);
        // Handle error as needed
        placeholder.remove()
        submit_btn.disabled = false;
        file_list = [];
    });
}


// Function to add a user message (left aligned bubbles)
function addUserMessage(message, files) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('d-flex', 'justify-content-start', 'message');

    const bubble = document.createElement('div');
    bubble.classList.add('bg-light', 'p-4', 'border', 'rounded', 'w-75');
    bubble.textContent = message;

    messageDiv.appendChild(bubble);

    // Check if there are any files and add image previews as a footer in the message bubble
    if (files && files.length > 0) {
        const previewFooter = document.createElement('div');
        // Add some spacing and make the previews display side-by-side
        previewFooter.classList.add('mt-2', 'd-flex', 'flex-wrap', 'gap-2');

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    // Set fixed dimensions for the preview
                    img.style.maxWidth = '100px';
                    img.style.maxHeight = '100px';
                    img.classList.add('rounded', 'border');
                    previewFooter.appendChild(img);
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                // Create a PDF icon using inline SVG inside a styled container
                const pdfContainer = document.createElement('div');
                pdfContainer.classList.add('pdf-icon');
                pdfContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-filetype-pdf" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM1.6 11.85H0v3.999h.791v-1.342h.803q.43 0 .732-.173.305-.175.463-.474a1.4 1.4 0 0 0 .161-.677q0-.375-.158-.677a1.2 1.2 0 0 0-.46-.477q-.3-.18-.732-.179m.545 1.333a.8.8 0 0 1-.085.38.57.57 0 0 1-.238.241.8.8 0 0 1-.375.082H.788V12.48h.66q.327 0 .512.181.185.183.185.522m1.217-1.333v3.999h1.46q.602 0 .998-.237a1.45 1.45 0 0 0 .595-.689q.196-.45.196-1.084 0-.63-.196-1.075a1.43 1.43 0 0 0-.589-.68q-.396-.234-1.005-.234zm.791.645h.563q.371 0 .609.152a.9.9 0 0 1 .354.454q.118.302.118.753a2.3 2.3 0 0 1-.068.592 1.1 1.1 0 0 1-.196.422.8.8 0 0 1-.334.252 1.3 1.3 0 0 1-.483.082h-.563zm3.743 1.763v1.591h-.79V11.85h2.548v.653H7.896v1.117h1.606v.638z"/>
            </svg>`;
                previewFooter.appendChild(pdfContainer);
            }
        });

        // Append the footer with image previews to the message bubble
        bubble.appendChild(previewFooter);
    }

    chatBox.appendChild(messageDiv);
    // Scroll to the bottom of the chat
    chatBox.scrollTop = chatBox.scrollHeight;
}


// Function to add a bot message (right aligned bubbles)
function addBotMessage(message) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('d-flex', 'justify-content-end', 'message');

    const bubble = document.createElement('div');
    bubble.classList.add('bg-primary', 'text-white', 'p-4', 'border', 'rounded', 'w-75');
    const formattedMessage = marked.parse(message);
    bubble.innerHTML = formattedMessage;

    messageDiv.appendChild(bubble);
    chatBox.appendChild(messageDiv);
    // Scroll to the bottom
    //chatBox.scrollTop = chatBox.scrollHeight;
    chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: 'smooth'
    });
}


// Temp bubble msg on bot side to let the user know that a msg is coming.
function addBotPlaceholderMessage() {
    const chatBox = document.getElementById('chatBox');
    const placeholderDiv = document.createElement('div');
    placeholderDiv.classList.add('d-flex', 'justify-content-end', 'message');

    const bubble = document.createElement('div');
    bubble.classList.add('bg-primary', 'text-white', 'p-4', 'border', 'rounded', 'w-75');

    const placeholderContent = document.createElement('div');
    placeholderContent.classList.add('placeholder-glow');

    // Randomly choose the number of placeholder lines (between 2 and 5)
    const lineCount = Math.floor(Math.random() * 4) + 2;

    for (let i = 0; i < lineCount; i++) {
        const line = document.createElement('span');
        // Randomly choose a width between 4 and 10 (e.g., col-4 to col-10)
        const width = Math.floor(Math.random() * 7) + 4;
        line.className = `placeholder col-${width} d-block`;
        placeholderContent.appendChild(line);
    }

    bubble.appendChild(placeholderContent);
    placeholderDiv.appendChild(bubble);
    chatBox.appendChild(placeholderDiv);
    chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: 'smooth'
    });

    return placeholderDiv;
}


// Sidebar functions ==========================================================
/**
 * Initializes the sidebar by clearing existing buttons
 * and adding new ones based on retrieved chat data.
 *
 * @returns {Promise<void>}
 */
async function initSidebar() {
    const sidebar = document.getElementById("sidebarContainer");

    if (!sidebar) {
        console.warn("Sidebar container element with id 'sidebarContainer' not found.");
        return;
    }

    sidebar.innerHTML = "";

    try {
        const resp = await webui.getChats();
        const chats = JSON.parse(resp);
        
        Object.entries(chats).forEach(([key, chat]) => {
            addSidebarButton(key, chat.title);
        });
    } catch (error) {
        console.error("Failed to initialize sidebar:", error);
    }
}


/**
 * Adds a sidebar button with a delete option.
 *
 * @param {number} hist_id - The unique ID associated with the chat history.
 * @param {string} title - The title text to display on the button.
 * @returns {void}
 */
function addSidebarButton(hist_id, title) {
    const sidebar = document.getElementById("sidebarContainer");
    if (!sidebar) {
        console.error("Sidebar container element with id 'sidebarContainer' not found.");
        return;
    }

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "d-flex align-items-stretch my-2";

    // Main button ====================
    const mainButton = document.createElement("button");
    Object.assign(mainButton, {
        id: `hist_id-${hist_id}`,
        type: "button",
        className: "btn btn-secondary flex-grow-1 rounded-0",
        textContent: title,
    });
    // Bootstrap attributes
    mainButton.setAttribute('data-bs-dismiss', "offcanvas");
    // onclick event
    mainButton.addEventListener("click", () => {
        document.getElementById('chatTitle').innerText = title;
        updateChatWindow(hist_id);
        current_hist = hist_id;
    });

    // Delete Button ==================
    const deleteButton = document.createElement("button");
    Object.assign(deleteButton, {
        type: "button",
        className: "btn btn-outline-danger rounded-0",
        textContent: "X",
    });
    deleteButton.style.marginLeft = "auto";
    // onclick event
    deleteButton.addEventListener("click", () => {
        if (current_hist === hist_id) {
            current_hist = -1;
            updateChatWindow(current_hist);
        }
        webui.removeHistory(hist_id);
        buttonContainer.remove();
    });

    buttonContainer.append(mainButton, deleteButton);
    sidebar.appendChild(buttonContainer);
}


// ============================================================================
// Dealing with preview docs after chat reload
/**
 * Converts a dataURL (base64-encoded) into a File object.
 * Generates the filename using the first 8 characters of the base64 data + proper file extension.
 *
 * @param {string} dataURL - The dataURL to convert.
 * @returns {File} A File object constructed from the given dataURL.
 */
function dataURLToFile(dataURL) {
    const [meta, base64] = dataURL.split(',');
    const mimeMatch = meta.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    
    // Decode base64
    const bstr = atob(base64);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }

    // Extract extension from mime type
    const extension = mime.split('/')[1] || 'bin';
    
    // Create a simple fingerprint from the first 8 characters of base64
    const fingerprint = base64.slice(0, 8);
    const filename = `${fingerprint}.${extension}`;

    return new File([u8arr], filename, { type: mime });
}


/**
 * Updates the chat window with messages from the specified history ID.
 *
 * @param {string|number} hist_id - The ID of the chat history to load.
 * @returns {Promise<void>}
 */
async function updateChatWindow(hist_id) {
    if (hist_id === -1) {
        document.getElementById('chatBox').innerHTML = '';
        document.getElementById('chatTitle').innerText = 'Document Assistant';
        current_hist = -1;
        return;
    }

    try {
        const mesgResp = await webui.getMessages(hist_id);
        const chatBox = document.getElementById('chatBox');
        chatBox.innerHTML = '';

        const chats = JSON.parse(mesgResp);
        const messageOrder = [];

        const fetchDocsTasks = [];

        for (const key in chats) {
            if (!chats.hasOwnProperty(key)) continue;

            const { message: chatMessage, order_number: orderNumber, history_id: historyId, role_id: roleId } = chats[key];

            const messageItem = { 
                key: Number(key), 
                chatMessage, 
                orderNumber, 
                historyId, 
                roleId, 
                docList: []  // 👈 Each message has its own document list
            };

            if (roleId === 1) {
                // Fetch docs for this specific message
                const fetchTask = webui.getDocs(key).then(docResp => {
                    if (docResp !== "") {
                        const urls = docResp.split('|');
                        messageItem.docList = urls.map(url => dataURLToFile(url));
                    }
                });
                fetchDocsTasks.push(fetchTask);
            }

            messageOrder.push(messageItem);
        }

        // Wait for all document fetching tasks to complete
        await Promise.all(fetchDocsTasks);

        // Sort messages by key (ensures correct order)
        messageOrder.sort((a, b) => a.key - b.key);

        for (const item of messageOrder) {
            switch (item.roleId) {
                case 1:
                    addUserMessage(item.chatMessage, item.docList); // 👈 now passing per-message docs
                    break;
                case 2:
                    addBotMessage(item.chatMessage);
                    break;
                default:
                    console.warn(`Unknown role_id: ${item.roleId}`);
                    break;
            }
        }
    } catch (error) {
        console.error("Error loading messages:", error);
    }
}



// API KEY STUFF ==============================================================
/**
 * Submits the API key by retrieving the value from the input field
 * and passing it to the `webui.updateKey` function.
 * 
 * @returns {void}
 */
function submitAPIKey() {
    // Get the value of the API key input field
    var apiKey = document.getElementById('apiKeyInput').value;
    
    // Update the key using the webui update function
    webui.updateKey(apiKey);
}

/**
 * Retrieves the stored API key and sets it as the value of the input field.
 * The API key is fetched asynchronously from the webui.getKey function.
 * 
 * @returns {Promise<void>} Resolves when the API key is successfully retrieved
 */
async function getAPIKey() {
    // Fetch the stored API key and set it to the input field
    webui.getKey().then(resp => {
        // Set the retrieved API key to the input field
        document.getElementById('apiKeyInput').value = resp;
    }).catch(error => {
        console.error('Error fetching API Key:', error);
    });
}