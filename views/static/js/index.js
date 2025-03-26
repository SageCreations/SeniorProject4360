let user_history = []
let bot_history = []

async function handleQuery() {
    let input_field = document.getElementById('chatInput');
    let query = input_field.value;
    addUserMessage(query);
    user_history.push(query);

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
function addUserMessage(message) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('d-flex', 'justify-content-start', 'message');

    const bubble = document.createElement('div');
    bubble.classList.add('bg-light', 'p-4', 'border', 'rounded', 'w-75');
    bubble.textContent = message;

    messageDiv.appendChild(bubble);
    chatBox.appendChild(messageDiv);
    // Scroll to the bottom
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
