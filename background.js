// Function to apply or remove the sidebar blur style
function toggleCSS(tabId, applyStyles) {
    chrome.scripting.executeScript({
        target: { tabId },
        func: (apply) => {
            const side = document.getElementById("side");
            if (side) {
                side.style.filter = apply ? "blur(5px)" : "";
            }
        },
        args: [applyStyles]
    });
}

// Listener for browser action (click on extension icon)
chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url !== "https://web.whatsapp.com/") return;

    const stored = await chrome.storage.local.get("whatsapp_sidebar_blur");
    const isApplied = stored.whatsapp_sidebar_blur === true;

    toggleCSS(tab.id, !isApplied);
    await chrome.storage.local.set({ whatsapp_sidebar_blur: !isApplied });
});

// Listener for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "loading" && tab.url === "https://web.whatsapp.com/") {
        const stored = await chrome.storage.local.get("whatsapp_sidebar_blur");
        if (stored.whatsapp_sidebar_blur === true) {
            toggleCSS(tabId, true);
        }
    }
});
