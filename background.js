// Function to apply or remove CSS styles based on the current state
function toggleCSS(tabId, applyStyles) {
    const code = applyStyles ?
        `document.getElementById('side').style.filter = 'blur(5px)';` :
        `document.getElementById('side').style.filter = '';`;

    chrome.tabs.executeScript(tabId, {
        code: code
    });
}

// Listener for browser action (click on extension icon)
chrome.browserAction.onClicked.addListener(function (tab) {
    // Check if the current tab is WhatsApp web
    if (tab.url === "https://web.whatsapp.com/") {

        // Initialize the variable cssApplied based on localStorage
        const storedValue = localStorage.getItem('whatsapp_sidebar_blue');

        // Variable to track whether CSS styles are applied or not
        if (storedValue === "true") {
            // Toggle CSS styles on and off
            toggleCSS(tab.id, false);

            localStorage.removeItem('whatsapp_sidebar_blue');
        } else {
            // Toggle CSS styles on and off
            toggleCSS(tab.id, true);

            localStorage.setItem('whatsapp_sidebar_blue', true);
        }
    }
});

// Listener for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if tab is WhatsApp web and is loading
    if (changeInfo.status === "loading" && tab.url === "https://web.whatsapp.com/") {

        // Initialize the variable cssApplied based on localStorage
        const storedValue = localStorage.getItem('whatsapp_sidebar_blue');

        // Variable to track whether CSS styles are applied or not
        if (storedValue === "true") {
            toggleCSS(tab.id, true);
        }
    }
});
