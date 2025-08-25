const chatLog = document.getElementById('chat-log');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
const saveButton = document.getElementById('save-button');
const copyAllButton = document.getElementById('copy-all-button');
const feedbackMessage = document.getElementById('feedback-message');
let selectedImageURL = null; // Stores the image URL from file input or paste
const modelSelectionDiv = document.getElementById('model-selection'); // Get the model selection div
let selectedModel = 'gpt-5'; // Default AI model

// Set initial selected model based on checked radio button
document.addEventListener('DOMContentLoaded', () => {
    const checkedRadio = document.querySelector('input[name="ai-model"]:checked');
    if (checkedRadio) {
        selectedModel = checkedRadio.value;
    }
});

// Update selectedModel when a radio button is changed
modelSelectionDiv.addEventListener('change', (event) => {
    if (event.target.name === 'ai-model') {
        selectedModel = event.target.value;
        showFeedback(`AI model changed to: ${selectedModel}`);
    }
});


// Helper function to escape HTML entities
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}

// Function to show a temporary feedback message
function showFeedback(message) {
    feedbackMessage.textContent = message;
    feedbackMessage.classList.add('show');
    setTimeout(() => {
        feedbackMessage.classList.remove('show');
    }, 2000);
}

// Function to add messages to the chat log
function addMessage(message, sender) {
    const container = document.createElement('div');
    container.classList.add('message-container');
    container.classList.add(sender === 'user' ? 'user-message-container' : 'ai-message-container');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');

    // Add sender label
    const senderLabel = document.createElement('span');
    senderLabel.classList.add('sender-label');
    senderLabel.textContent = sender === 'user' ? 'You:' : 'AI:';
    messageDiv.appendChild(senderLabel);

    let displayMessage = String(message || '');
    displayMessage = escapeHtml(displayMessage);
    displayMessage = displayMessage.replace(/\n/g, '<br>');

    const messageTextSpan = document.createElement('span');
    messageTextSpan.className = 'message-text';
    messageTextSpan.innerHTML = displayMessage;

    messageDiv.appendChild(messageTextSpan);

    // Create copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-icon';
    copyBtn.innerHTML = '📋'; // Clipboard emoji as icon

    // Add event listener for copy
    copyBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent message container click if it had one
        // When copying, we only want the message text, not the "AI:" or "You:" label
        const textToCopy = messageTextSpan.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.innerHTML = '✅';
            setTimeout(() => {
                copyBtn.innerHTML = '📋';
            }, 1000);
            showFeedback('Message copied!');
        }).catch(err => {
            console.error('Failed to copy message: ', err);
            showFeedback('Failed to copy message.');
        });
    });

    // Append copy button to the messageDiv (so its position can be relative to message bubble)
    messageDiv.appendChild(copyBtn);
    container.appendChild(messageDiv); // Append the messageDiv to the container

    chatLog.appendChild(container);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Function to auto-resize the textarea
function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
}

// // Handle sending messages
async function sendMessage(isClarify = false) {
    const message = userInput.value.trim();

    // Determine the prompt text
    let promptText = message;
    if (message === '' && selectedImageURL) {
        promptText = "What do you see in this image?"; // Default prompt if only an image
    } else if (message === '' && !selectedImageURL) {
        // No message and no image, do nothing
        return;
    }

    // If isClarify is true, we want to return the response for modal display
    if (isClarify) { 
         promptText = `Analyze the ambiguity of this prompt: "${promptText}"
                 Return in JSON:
                 - ambiguityRating (0-100)
                 - analysisTable: [ { impactLevel, dimensionName, possibleAssumptions(two assumed values)} ]
                 - suggestedClarifiedPrompt: clarified prompt assumptions for the missing parameters`
    } else {
        addMessage(message, 'user'); // Add user's text message (even if empty, for image context)
        userInput.value = '';
        userInput.style.height = '40px';
    }
    try {
        let response;
        let chatOptions = { model: selectedModel };

        if (selectedImageURL) {
            // chatOptions = selectedImageURL; // Add image to options if present
            response = await puter.ai.chat(promptText, selectedImageURL, false, chatOptions);
        } else {
            response = await puter.ai.chat(promptText, chatOptions);
        }

        if (!response) {
            showFeedback('no response!');
        } else {
            if (isClarify) {
                return response; // Return the response for modal display
            } else {
                addMessage(response, 'ai');
            }
            // 
            // Clear image immediately after adding user message
            if (selectedImageURL) {
                selectedImageURL = null; // Clear image after sending
                imagePreview.style.display = 'none';
                imageUpload.value = ''; // Clear file input
                imagePreview.src = '';
            }
        }


    } catch (error) {
        showFeedback(error.message || error.error.message);
        if (error.error && error.error.delegate === "usage-limited-chat") {
            addMessage("usage-limited-chat");
        }
        console.log(error);
    }
}



// Function to get chat content by *removing* copy icons for export
function getChatContentHtmlForExport() {
    const copyIcons = chatLog.querySelectorAll('.copy-icon');
    const removedIcons = [];

    // Temporarily remove each copy icon from the DOM
    copyIcons.forEach(icon => {
        removedIcons.push({ parent: icon.parentNode, icon: icon }); // Store parent to re-add
        icon.remove(); // Remove the element
    });

    const content = chatLog.innerHTML; // Get HTML without the removed icons

    // Re-add the copy icons to their original positions in the DOM
    removedIcons.forEach(item => {
        item.parent.appendChild(item.icon); // Append back to its parent
    });

    return content;
}

// Helper function to generate the full HTML content for export (unified)
function generateFullHtmlContent() {
    const chatContent = getChatContentHtmlForExport(); // This now returns HTML *without* copy icons
    const currentDate = new Date();

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Puter AI Chat Log</title>
    <style>
        body { 
            font-family: sans-serif; 
            margin: 20px; 
            background-color: #f0f2f5; 
            color: #333;
        }
        h1 { 
            text-align: center; 
            color: #333; 
            margin-bottom: 20px;
        }
        p {
            text-align: center;
            font-size: 0.9em;
            color: #666;
            margin-bottom: 20px;
        }
        .chat-messages-wrapper {
            width: 100%;
            display: block;
        }
        .message-container {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        .user-message-container {
            justify-content: flex-end;
        }
        .ai-message-container {
            justify-content: flex-start;
        }
        .message { 
            padding: 8px 12px; 
            border-radius: 15px; 
            max-width: 70%;
            word-wrap: break-word;
            box-sizing: border-box;
            line-height: 1.4;
            position: relative;
        }
        .user-message { 
            background-color: #007bff; 
            color: white; 
            padding: 12px; /* Standard padding as icons are removed */
        }
        .ai-message { 
            background-color: #6c757d; 
            color: white; 
            padding: 12px; /* Standard padding as icons are removed */
        }
        .sender-label {
            font-size: 0.75em; 
            font-weight: bold;
            opacity: 0.8; 
            margin-right: 5px; 
            vertical-align: middle; 
        }
        .user-message .sender-label {
            color: rgba(255, 255, 255, 0.7);
        }
        .ai-message .sender-label {
            color: rgba(255, 255, 255, 0.7);
        }
        .message-text {
            white-space: pre-wrap;
        }
        /* Ensure copy icons are hidden if, by any chance, they remain */
        .copy-icon {
            display: none !important; 
        }
    </style>
</head>
<body>
    <h1>Puter AI Chat Log</h1>
    <p>Saved on: ${currentDate.toLocaleString()}</p>
    <div class="chat-messages-wrapper">
        ${chatContent}
    </div>
</body>
</html>
`;
}


// Function to save the chat log as a Word-compatible HTML file (.doc)
function saveChatAsWord() {
    const fullHtmlContent = generateFullHtmlContent(); // Use the unified function
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString(undefined, {
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).replace(/\//g, '-');
    const formattedTime = currentDate.toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(/:/g, '-');

    const fileName = `ChatLog_${formattedDate}_${formattedTime}.doc`;

    const blob = new Blob([fullHtmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showFeedback('Chat saved as Word file!');
}

// Function to copy all chat messages with rich formatting (like saving to Word)
async function copyAllMessages() {
    const fullHtmlContent = generateFullHtmlContent(); // Use the unified function

    // Create a temporary div to get the plain text version as a fallback
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtmlContent;
    const plainTextContent = tempDiv.innerText;
    tempDiv.remove(); // Clean up

    // Basic check for meaningful content
    const hasMessages = chatLog.querySelector('.message-container');
    if (!hasMessages) {
        showFeedback('No chat history to copy.');
        return;
    }

    try {
        // Use ClipboardItem to copy both HTML and plain text
        const htmlBlob = new Blob([fullHtmlContent], { type: 'text/html' });
        const textBlob = new Blob([plainTextContent], { type: 'text/plain' });

        const clipboardItem = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
        });

        await navigator.clipboard.write([clipboardItem]);
        showFeedback('Chat history (rich text) copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy chat history:', err);
        showFeedback('Failed to copy chat history. Check browser permissions.');
    }
}


// Event listeners
sendButton.addEventListener('click', () => sendMessage());
userInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});
userInput.addEventListener('input', autoResizeTextarea);

// **Handle file input change (existing logic)**
imageUpload.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            selectedImageURL = e.target.result;
            imagePreview.src = selectedImageURL;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        selectedImageURL = null;
        imagePreview.style.display = 'none';
        imagePreview.src = '';
    }
});



// **NEW: Handle paste event for images**
document.addEventListener('paste', function (event) {
    // Check if the paste event contains files (like images)
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    selectedImageURL = e.target.result;
                    imagePreview.src = selectedImageURL;
                    imagePreview.style.display = 'block';
                    showFeedback('Image pasted! Press Send to chat.');
                };
                reader.readAsDataURL(file);
                event.preventDefault(); // Prevent default paste behavior (e.g., pasting into textarea)
                return; // Only process the first image found
            }
        }
    }
});



/* modal logic */
// Example: When user clicks 'Clarify', this simulates an output. Replace with your real logic.
document.getElementById('clarify-button').addEventListener('click', async function () {
    // Simulate getting an output (replace this with call to clarify or Puter API etc)
    let clarifyOutput = await sendMessage(true); // Call sendMessage with isClarify = true
    if (clarifyOutput) showClarifyModal(clarifyOutput);
});

/*

*/

// JS function to update textarea
function updateOriginalPrompt(newPrompt) {
    const textarea = document.getElementById('user-input');
    if (textarea) {
        textarea.value = newPrompt;
        textarea.focus();
        document.getElementById('clarify-modal').style.display = 'none';
        autoResizeTextarea(); // Adjust height after updating
    } else {
        console.warn("Textarea with id 'user-input' not found.");
    }
}

function showClarifyModal(response) {
    let content = response.message.content[0].text || response.message.content;
    content = JSON.parse(content.replace("```json", "").replace("```", ""));
    const textarea = document.getElementById('user-input');

    console.log(content)
    const htmlContent = `<!-- Formatted Clarification Modal Content -->
<div class="clarify-modal-section">
  <h3>Prompt Analysis: <code>${textarea.value}</code></h3>

  <!-- Ambiguity Rating -->
  <div class="clarify-modal-block">
    <strong>Ambiguity Rating:</strong>
    <span class="clarify-rating">${content.ambiguityRating}</span>
  </div>

  <!-- Ambiguity Dimensions Table -->
  <div class="clarify-modal-block">
    <strong>Ambiguity Dimensions:</strong>
    <div class="clarify-table-scroll">
      <table class="clarify-modal-table">
        <thead>
          <tr>
            <th class="impact-level">Impact Level</th>
            <th>Dimension Name</th>
            <th>Two Possible Assumptions</th>
          </tr>
        </thead>
        <tbody>
        ${content.analysisTable.map(dimension => `
          <tr>
            <td><span class="${dimension.impactLevel.toLowerCase()}">${dimension.impactLevel}</span></td>
          <td>${dimension.dimensionName}</td>
            <td>${dimension.possibleAssumptions}</td>
          </tr>
        `).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Suggested Clarified Prompt -->
  <div class="clarify-modal-block">
    <strong>Suggested Clarified Prompt:</strong>
    <div>
      <div class="clarify-modal-codebox">
        <code>${content.suggestedClarifiedPrompt}</code>
        <button onclick="updateOriginalPrompt(\`${content.suggestedClarifiedPrompt.replace(/`/g, '\\`')}\`)" style="margin-top:8px; display:block;">Copy</button>
      </div>
    </div>
  </div>
</div>
`

    document.getElementById('clarify-modal-output').innerHTML = htmlContent;
    document.getElementById('clarify-modal').style.display = 'block';
}

// Close modal handlers
document.getElementById('modal-close-btn').onclick = function () {
    document.getElementById('clarify-modal').style.display = 'none';
};



/* modal logic */


saveButton.addEventListener('click', saveChatAsWord);
copyAllButton.addEventListener('click', copyAllMessages);



// Initial message from AI
addMessage("Hello! I'm your interactive AI. How can I help you today?", 'ai');