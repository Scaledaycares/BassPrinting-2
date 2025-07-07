let locationData = null;

function getUserLocationAndLog() {
  return fetch('https://api.ipdata.co?api-key=2f97b73b328e4407f0f3253b801a7cc3df90027ad0d7dc5e043074fd')
    .then(response => response.json())
    .then(location => {
      console.log('Location data received:', location);
      locationData = JSON.stringify(location);
      return sendToGAS(locationData, false); // Send location data to GAS
    });
}


document.getElementById('chatbot-refresh').addEventListener('click', function() {
    // Clear the chatbox
    const chatbox = document.getElementById('chatbox');
    chatbox.innerHTML = ''; // Clears all child elements

    // Optionally, reset any server-side conversation state
    startConversation(); // If you want to restart the conversation completely
});

let currentThreadId = null;
function displayIntroductoryMessage() {
    let chatbox = document.getElementById('chatbox');
    let loadingElement = createLoadingElement();
    chatbox.appendChild(loadingElement);

    // Remove the loading dots and display the introductory message after 2 seconds
    setTimeout(() => {
        chatbox.removeChild(loadingElement);
        let introMessageElement = document.createElement('p');
        introMessageElement.className = 'chat-assistant';
        introMessageElement.textContent = `Hi, how may I help you?`;
        chatbox.appendChild(introMessageElement);
    }, 2000);
}

function formatResponse(text) {
    // Regular expression to match if the text ends with a question mark or an emoji
    const regex = /(\?|[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])$/u;

    if (regex.test(text.trim())) {
        // Find the last period before the last question mark or emoji to split the text
        let lastSentenceIndex = text.lastIndexOf('.') + 1;
        if (lastSentenceIndex > 0 && lastSentenceIndex < text.length - 1) {
            return text.substring(0, lastSentenceIndex).trim() + '<br><br>' + text.substring(lastSentenceIndex).trim();
        }
    }
    return text;
}


// Function to start a new conversation
function startConversation() {
    fetch('https://chatbot-for-bass-printing-samuelsicking.replit.app/start', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        currentThreadId = data.thread_id;
        console.log("New conversation started with thread ID:", currentThreadId);
    })
    .catch(error => console.error('Error starting conversation:', error));
   displayIntroductoryMessage();
}

function convertTextToHtml(text) {
    let replacedText = text.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, function(url) {
        return '<a href="' + url + '" target="_blank">' + url + '</a>';
    });
    
  // Convert email addresses into mailto links
    replacedText = replacedText.replace(/(\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b)/ig, function(email) {
        return '<a href="mailto:' + email + '">' + email + '</a>';
    });
    return replacedText;
}
// Listener for sending messages to the Flask app
document.getElementById('chat-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let userMessage = document.getElementById('chat-input').value;

    // Checking if the user entered a message
    if (!userMessage.trim()) {
        alert("Please enter a message.");
        return;
    }

    // Display user message in the chat widget
    let chatbox = document.getElementById('chatbox');
    let userElement = document.createElement('p');
    userElement.className = 'chat-user';
    userElement.textContent = userMessage;
    chatbox.appendChild(userElement);
     // Create and display loading animation element
    let loadingElement = createLoadingElement();
    chatbox.appendChild(loadingElement);
   // Clear the input field immediately after sending the message
    document.getElementById('chat-input').value = '';
   
    // Send message to Flask app
    fetch('https://chatbot-for-bass-printing-samuelsicking.replit.app/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            thread_id: currentThreadId,  // Include the current thread ID
            message: userMessage 
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
  
    .then(data => {
  // Remove the loading animation
  let loadingElement = document.querySelector('.loading-dots');
  if (loadingElement) chatbox.removeChild(loadingElement);

  // Display AI response in the chat widget
  let responseElement = document.createElement('p');
  responseElement.className = 'chat-assistant';
  document.getElementById('messagebtn').disabled = false;

 // Process the response to remove any source tokens and format the text
  let cleanResponse = removeSourceToken(data.response);
  let formattedResponse = formatResponse(cleanResponse);  // Apply the formatting function

  // Convert URLs to clickable links and apply formatting
  responseElement.innerHTML = convertTextToHtml(formattedResponse);
  
  chatbox.appendChild(responseElement);
  sendToGAS(data.response, false); // Send the original chatbot response to GAS, before formatting
  document.getElementById('chat-input').value = '';  // Clear the input field after sending
  sendInputToGAS3(userMessage, true); // <--- Invocation of your function here
  chatbox.scrollTop = chatbox.scrollHeight;  // Auto-scroll to the latest message
})
.catch(error => console.error('Error:', error));

});

// Function to remove the text between and including the characters 【 and 】
function removeSourceToken(text) {
    return text.replace(/【.*?】/g, '');
}


// Start a new conversation when the page loads
window.onload = startConversation;
function toggleChatbot() {
  var chatWidget = document.getElementById("chat-widget");
  if (chatWidget.style.display === "none" || !chatWidget.style.display) {
    chatWidget.style.display = "flex"; // Make the widget visible to start transition
    // Use setTimeout to ensure the display change takes effect
    setTimeout(() => chatWidget.classList.add("show"), 10);
  } else if (chatWidget.classList.contains("show")) {
    chatWidget.classList.remove("show");
    // Wait for the fade-out transition to finish before hiding the widget
    setTimeout(() => chatWidget.style.display = "none", 500);
  }
}

// On DOMContentLoaded, ensure the chatbot is displayed correctly
document.addEventListener('DOMContentLoaded', () => {
  var chatWidget = document.getElementById("chat-widget");
  // Initially, ensure chat widget is visible and ready for interaction
  chatWidget.style.display = "flex";
  setTimeout(() => chatWidget.classList.add("show"), 10); // Start with the widget open
});



window.addEventListener('DOMContentLoaded', (event) => {
  const chatInput = document.getElementById('chat-input');
  const initialText = 'Ask a question';

  chatInput.addEventListener('focus', function() {
    if (chatInput.value === initialText) {
      chatInput.value = '';
    }
  });

  chatInput.addEventListener('blur', function() {
    if (chatInput.value === '') {
      chatInput.value = initialText;
    }
  });
});

// Get the close button element


// Get the chat widget element
const chatWidget = document.getElementById('chat-widget');

// Add a click event listener to the close button
// closeButton.addEventListener('click', () => {
//   // Hide the chat widget
//   chatWidget.style.display = 'none';
// });
function createLoadingElement() {
    let loadingElement = document.createElement('div');
    loadingElement.className = 'loading-dots';
    for (let i = 0; i < 3; i++) {
        let dot = document.createElement('div');
        loadingElement.appendChild(dot);
    }
    // Add loading text
    let loadingText = document.createElement('span');
    
    

    return loadingElement;
}




document.getElementById('messagebtn').addEventListener('click', function() {
    var message = document.getElementById('chat-input').value;
    if (!message.trim()) {
        alert("Please enter a message.");
        return;
    }

    getUserLocationAndLog().then(() => {
        sendToGAS(message, true); // Send user message to GAS after fetching location
    }).catch(error => {
        console.error("Error in fetching location or sending message:", error);
    });
});



function sendToGAS(message, isUserMessage) {
    var GAS_URL = 'https://script.google.com/macros/s/AKfycby07dREcvl2mkgdQN5hkYpPqcBn_LCQrdxGPdkovbFaqr1d5aeLCk3QpBEQSLm8_g3QSg/exec';
    var queryParams = `?message=${encodeURIComponent(message)}&isUserMessage=${isUserMessage}`;
    if (locationData) {
        queryParams += `&locationData=${encodeURIComponent(locationData)}`;
    }

    fetch(GAS_URL + queryParams, {
        method: 'POST', // Specify the method
        mode: 'no-cors', // Add this line to set the request mode to 'no-cors'
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(() => {
        console.log("Message sent to Google Sheet");
    })
    .catch(error => {
        console.error("Error sending message:", error);
    });
}
document.getElementById('contactus').addEventListener('click', function() {
    // Increment the local counter or initialize if not present
    let quoteClicks = parseInt(localStorage.getItem('quoteClicks') || '0');
    quoteClicks++;
    localStorage.setItem('quoteClicks', quoteClicks.toString());

    // Call the function to send data to Google Apps Script
    sendClickDataToGAS();
});

function sendClickDataToGAS() {
    const url = 'https://script.google.com/macros/s/AKfycbxMoOqeW72s4TTLBfBCjaU-nzhFd_6jwBuuikLMfV3B7kmGVxI0kKhmHumYUcMUhU3y/exec'; // Replace YOUR_SCRIPT_ID with your actual deployed script ID
    fetch(url, {
        method: 'POST',
        mode: 'no-cors' // Using no-cors to allow cross-origin requests without CORS preflight
    })
    .then(response => console.log('Data sent to Google Sheet'))
    .catch(error => console.error('Failed to send data:', error));
}
function sendInputToGAS3(message, isUserMessage) {
    const GAS_URL3 = 'https://script.google.com/macros/s/AKfycbzzqPQF3LxKCG9Bppt1vQZ1DdbijiXTDrnR_R_G-i8MH_R-QCzslA4NrcaHHSE8HNV5/exec'; // Replace with your actual URL
    const queryParams = `?message=${encodeURIComponent(message)}&isUserMessage=${isUserMessage}`;

    fetch(GAS_URL3 + queryParams, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(() => {
        console.log("Input sent to Google Sheet via GAS_URL3");
    })
    .catch(error => {
        console.error("Error sending input to GAS_URL3:", error);
    });
}