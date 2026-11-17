// Voice-to-text button injected next to WhatsApp Web's own mic icon.
// Uses the browser's built-in SpeechRecognition (Chrome's "voice to text").

(function () {
    const STORAGE_KEY = "wa_vtt_lang";
    const LANGS = [
        { code: "bn-BD", label: "বাং" },
        { code: "en-US", label: "EN" }
    ];

    let currentLangIndex = 0;
    let recognition = null;
    let listening = false;
    let targetEditable = null;

    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;

    function loadLang() {
        const saved = localStorage.getItem(STORAGE_KEY);
        const idx = LANGS.findIndex((l) => l.code === saved);
        currentLangIndex = idx >= 0 ? idx : 0;
    }

    function saveLang() {
        localStorage.setItem(STORAGE_KEY, LANGS[currentLangIndex].code);
    }

    function findComposeFooter() {
        const footers = document.querySelectorAll("footer");
        for (const footer of footers) {
            if (footer.querySelector("div[contenteditable='true'][role='textbox']")) {
                return footer;
            }
        }
        return null;
    }

    function findComposeBox() {
        const footer = findComposeFooter();
        if (!footer) return null;
        return footer.querySelector("div[contenteditable='true'][role='textbox']");
    }

    function insertTextIntoComposeBox(text) {
        const editable = targetEditable || findComposeBox();
        if (!editable || !text) return;

        editable.focus();

        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editable);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        document.execCommand("insertText", false, text);
    }

    function setButtonState(button, icon) {
        button.classList.toggle("wa-vtt-listening", listening);
        icon.innerHTML = listening ? micIconSvg(true) : micIconSvg(false);
    }

    function micIconSvg(active) {
        const color = active ? "#ff3b30" : "currentColor";
        return `<svg viewBox="0 0 24 24" width="20" height="20" fill="${color}">
            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/>
            <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.07A7 7 0 0 0 19 11z"/>
        </svg>`;
    }

    function startRecognition(button, icon) {
        if (!SpeechRecognitionImpl) {
            alert("এই ব্রাউজারে ভয়েস টু টেক্সট সাপোর্ট করে না।");
            return;
        }

        targetEditable = findComposeBox();

        recognition = new SpeechRecognitionImpl();
        recognition.lang = LANGS[currentLangIndex].code;
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            let finalText = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalText += event.results[i][0].transcript;
                }
            }
            if (finalText.trim()) {
                insertTextIntoComposeBox(finalText.trim() + " ");
            }
        };

        recognition.onerror = () => {
            listening = false;
            setButtonState(button, icon);
        };

        recognition.onend = () => {
            if (listening) {
                // keep listening until user explicitly stops
                try {
                    recognition.start();
                } catch (e) {
                    listening = false;
                    setButtonState(button, icon);
                }
            }
        };

        listening = true;
        setButtonState(button, icon);
        try {
            recognition.start();
        } catch (e) {
            listening = false;
            setButtonState(button, icon);
        }
    }

    function stopRecognition(button, icon) {
        listening = false;
        setButtonState(button, icon);
        if (recognition) {
            recognition.stop();
        }
    }

    function createLangToggle() {
        const toggle = document.createElement("div");
        toggle.className = "wa-vtt-lang-toggle";
        toggle.textContent = LANGS[currentLangIndex].label;
        toggle.title = "ভয়েস ল্যাঙ্গুয়েজ পরিবর্তন করুন";
        toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            currentLangIndex = (currentLangIndex + 1) % LANGS.length;
            toggle.textContent = LANGS[currentLangIndex].label;
            saveLang();
            if (listening && recognition) {
                recognition.lang = LANGS[currentLangIndex].code;
            }
        });
        return toggle;
    }

    function createVoiceButton() {
        const wrapper = document.createElement("div");
        wrapper.className = "wa-vtt-wrapper";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "wa-vtt-button";
        button.title = "ভয়েস টু টেক্সট";

        const icon = document.createElement("span");
        icon.className = "wa-vtt-icon";
        icon.innerHTML = micIconSvg(false);
        button.appendChild(icon);

        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (listening) {
                stopRecognition(button, icon);
            } else {
                startRecognition(button, icon);
            }
        });

        wrapper.appendChild(button);
        wrapper.appendChild(createLangToggle());
        return wrapper;
    }

    function findMicOrSendButton(footer) {
        const byIcon =
            footer.querySelector("span[data-icon='ptt-compact']") ||
            footer.querySelector("span[data-icon='ptt']") ||
            footer.querySelector("span[data-icon='send']") ||
            footer.querySelector("span[data-icon='wds-ic-send-filled']") ||
            footer.querySelector("span[data-icon='wds-ic-mic-filled']") ||
            footer.querySelector("[aria-label*='voice' i]") ||
            footer.querySelector("[aria-label*='Voice' i]") ||
            footer.querySelector("[title*='voice' i]");
        if (byIcon) {
            return byIcon.closest("button") || byIcon.closest("div[role='button']");
        }

        // Fallback: last button in the footer row that contains the compose box.
        const editable = footer.querySelector("div[contenteditable='true'][role='textbox']");
        if (!editable) return null;

        const buttons = Array.from(footer.querySelectorAll("button, div[role='button']"));
        if (!buttons.length) return null;
        return buttons[buttons.length - 1];
    }

    function injectButton() {
        if (document.querySelector(".wa-vtt-wrapper")) return;

        const footer = findComposeFooter();
        if (!footer) return;

        const targetButton = findMicOrSendButton(footer);
        if (!targetButton || !targetButton.parentElement) return;

        const voiceButton = createVoiceButton();
        // The mic/send button sits in a block-level div; insert one level up, in the flex row.
        const holder = targetButton.parentElement;
        const row = holder.parentElement;
        if (row && getComputedStyle(row).display === "flex") {
            row.insertBefore(voiceButton, holder);
        } else {
            holder.insertBefore(voiceButton, targetButton);
        }
    }

    loadLang();

    const observer = new MutationObserver(() => {
        injectButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    injectButton();
})();
