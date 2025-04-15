let file_list = [];
let current_hist = -1; // -1 by default, backend will create new history if -1.

document.addEventListener('DOMContentLoaded', function() {
    // DOM is loaded. Check if `webui` object is available
    if (typeof webui !== 'undefined') {
        // Set events callback
        webui.setEventCallback((e) => {
            if (e == webui.event.CONNECTED) {
                // Connection to the backend is established
                console.log('Connected.');
                current_hist = -1;
                initSidebar();


            } else if (e == webui.event.DISCONNECTED) {
                // Connection to the backend is lost
                console.log('Disconnected.');



            }
        });
    } else {
        // The virtual file `webui.js` is not included
        alert('Please add webui.js to your HTML.');
    }
});

// TODO: probably need to convert this to a onclick="" call in the html and make a async function to
//       send all the images to the backend for the OCR stuff to take over.
// TODO: look into encoding the images and pdf's into base64 to send to the backend as a string
// https://webui.me/docs/2.5/#/?id=javascript-decode
// could be encode or decode, not sure yet...
// const str = webui.decode(base64); // this is the line we need, base64 being the image encoded to base64 already
// Then call this in the python backend:
// decoded_string = webui.ui_decode("SGVsbG8=")
// print(f"Decoded String: {decoded_string}")  # Output: Hello

// Trigger file input when docBtn is clicked
document.getElementById('docBtn').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

// Handle file selection and update the UI
document.getElementById('fileInput').addEventListener('change', function(e) {
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
                        console.log("Image loaded successfully");
                        const width = img.naturalWidth;
                        const height = img.naturalHeight;
                        const augmentedData = `${dataURL},${width},${height}`;
                        console.log(augmentedData)
                        file_list.push(augmentedData);
                    };
                    img.src = dataURL;
                   
                }else {
                    file_list.push(dataURL);
                }
            };
            reader.readAsDataURL(file);

            // Check file type and display appropriate preview
            if (file.type.startsWith('image/')) {
                const preview_reader = new FileReader();
                preview_reader.onload = function(event) {
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



async function handleQuery() {
    let input_field = document.getElementById('chatInput');
    let query = input_field.value;

    // files if any
    // Get the file input element and its files
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files; // This is a FileList object
    console.log("files: ", files)
    console.log("files_list: ", file_list);

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
            // TODO: call ui updates here
            // title change
            // add a button to sidebar
            webui.getTitle(parseInt(parts[0], 10)).then(resp => {
                // title change
                document.getElementById('chatTitle').innerText = resp;
                // add a button to sidebar
                addSidebarButton(parseInt(parts[0], 10), resp)
            });
            
        }
        current_hist = parseInt(parts[0], 10);
        console.log("history_id: ", current_hist);

        // Get the remainder as a string.
        const bot_resp = parts.slice(1).join("|");
        console.log("bot_resp: ", bot_resp);

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

// Function to add a user message (left aligned)
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
        reader.onload = function(e) {
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

// Function to add a bot message (right aligned)
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

function createBubble(isUser) {
    const chatBox = document.getElementById('chatBox');
    const placeholderDiv = document.createElement('div');
    placeholderDiv.classList.add('d-flex', 'justify-content-end', 'message');

    const bubble = document.createElement('div');
    if (isUser === true) {
        bubble.classList.add('bg-light', 'p-4', 'border', 'rounded', 'w-75');
    } else {
        bubble.classList.add('bg-primary', 'text-white', 'p-4', 'border', 'rounded', 'w-75');
    }

}


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



// Sidebar functions ----------------------------------------------------------
// Function to initialize (or reset) the sidebar container.
async function initSidebar() {
    const sidebar = document.getElementById("sidebarContainer");
    if (sidebar) {
        // Clear out any existing buttons
        sidebar.innerHTML = "";
        webui.getChats().then(resp => {
            let obj = JSON.parse(resp);
            
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                  const title = obj[key].title;
                  addSidebarButton(key, title);
                }
            }
        });

    } else {
        console.warn("Sidebar container element with id 'sidebarContainer' not found.");
    }
}

// Function to add a single button to the sidebar.
// The parameter 'text' represents the button's label.
function addSidebarButton(hist_id, text) {
    const sidebar = document.getElementById("sidebarContainer");
    if (!sidebar) {
        console.error("Sidebar container element with id 'sidebarContainer' not found.");
        return;
    }
    
    // Create a container div that stretches its children.
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "d-flex align-items-stretch my-2"; // Use align-items-stretch for uniform height

    // Create the main sidebar button that grows to take available space.
    const mainButton = document.createElement("button");
    mainButton.id = `hist_id-${hist_id}`;
    mainButton.type = "button";
    mainButton.className = "btn btn-secondary flex-grow-1 rounded-0"; // Flex-grow to take all available space
    mainButton.setAttribute('data-bs-dismiss', "offcanvas");
    mainButton.textContent = text;
    mainButton.addEventListener("click", function() {
        console.log("Sidebar button clicked:", text);
        document.getElementById('chatTitle').innerText = text;
        updateChatWindow(hist_id);
        current_hist = hist_id;
    });
    buttonContainer.appendChild(mainButton);

    // Create the delete button that stays on the far right.
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-outline-danger rounded-0";
    deleteButton.textContent = "X";
    // Apply a left margin to push it to the right.
    deleteButton.style.marginLeft = "auto";
    deleteButton.addEventListener("click", function() {
        // When the delete button is clicked, update the chat if this entry is currently active.
        if (current_hist === hist_id) {
            current_hist = -1;
            updateChatWindow(current_hist);
        }
        webui.removeHistory(hist_id);
        buttonContainer.remove();
    });
    buttonContainer.appendChild(deleteButton);

    // Append the entire container to the sidebar.
    sidebar.appendChild(buttonContainer);
}






/**
 * Converts a data URL to a File object.
 * @param {string} dataURL - The data URL string.
 * @param {string} filename - The name for the new File.
 * @returns {File} - The reconstructed File object.
 */
function dataURLtoFile(dataURL) {
    // Split the data URL at the comma
    const arr = dataURL.split(',');
    
    // Extract the MIME type using a regular expression
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error('Invalid data URL.');
    }
    const mime = mimeMatch[1];
    
    // Decode base64 encoded string
    const bstr = atob(arr[1]);
    
    // Create an array of bytes
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    // Construct a File object with the name, data, and MIME type
    return new File([u8arr], "file", { type: mime });
}


// Update Chat window with new chat ===========================================
async function updateChatWindow(hist_id) {
    if (hist_id === -1) {
        document.getElementById('chatBox').innerHTML = '';
        document.getElementById('chatTitle').innerText = 'Document Assistant';
        current_hist = -1;
    } else {
        webui.getMessages(hist_id).then(mesgResp => {
            document.getElementById('chatBox').innerHTML = '';
            let chats = JSON.parse(mesgResp);
            message_order = [];
            let docs = [];
            
            // field_names=['message', "order_number", "history_id", "role_id"]
            for (const key in chats) {
                if (chats.hasOwnProperty(key)) {
                    const chat_message = chats[key].message;
                    const order_number = chats[key].order_number;
                    const history_id = chats[key].history_id;
                    const role_id = chats[key].role_id;
                    message_order.push({ key, chat_message, order_number, history_id, role_id });
                    
                    // //TODO: idk what todo with this yet
                    if (role_id === 1) {
                        // field_names=["history_id", "message", "role_id"]
                        webui.getDocs(key).then(docResp => {
                            url_list = docResp.split('|');
                            let doc_list = [];
                            Array.from(url_list).forEach(url => {
                                doc_list.push(dataURLtoFile(url));
                            });
                        });
                    }
                    // TODO: maybe doc stuff
                }
            }
            
            // ensures chat message order
            message_order.sort((a, b) => a.key - b.key);
            console.log(message_order);
            
            message_order.forEach(item => {
                switch (item.role_id) {
                    case 1:
                    addUserMessage(item.chat_message, doc_list); // TODO: add 'doc_list' here when safe
                    break;
                    case 2:
                    addBotMessage(item.chat_message);
                    break;
                    default:
                    break;
                }
            });
        });
        
        
    }
}