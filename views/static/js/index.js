let user_history = []
let bot_history = []

// TODO: probably need to convert this to a onclick="" call in the html and make a async function to
//       send all the images to the backend for the OCR stuff to take over.
// TODO: look into encoding the images and pdf's into base64 to send to the backend as a string

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

            // Check file type and display appropriate preview
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.classList.add('preview-img');
                    fileItem.appendChild(img);
                };
                reader.readAsDataURL(file);
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

    addUserMessage(query, files);
    user_history.push(query);



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

    webui.handleChat(user_history.join('|'), bot_history.join('|')).then(resp => {
        bot_history.push(resp);
        placeholder.remove();
        addBotMessage(resp);
        submit_btn.disabled = false;
    }).catch(error => {
        console.error(error);
        // Handle error as needed
        placeholder.remove()
        submit_btn.disabled = false;
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
