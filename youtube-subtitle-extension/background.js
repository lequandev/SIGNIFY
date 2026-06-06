// Signify Chrome Extension - Background Service Worker
console.log("Signify Background Service Worker initialized!");

let activePort = "8080";

async function detectActivePort() {
  const ports = ["8080", "8081"];
  for (const port of ports) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const res = await fetch(`http://127.0.0.1:${port}/api/ai/dictionary-lookup`, {
        method: 'OPTIONS',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      activePort = port;
      console.log("Detected active Signify backend port:", port);
      chrome.storage.local.set({ backendPort: port });
      return port;
    } catch (e) {
      // Ignore and try next
    }
  }
  for (const port of ports) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      const res = await fetch(`http://127.0.0.1:${port}/`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      activePort = port;
      console.log("Detected active Signify backend port via root:", port);
      chrome.storage.local.set({ backendPort: port });
      return port;
    } catch (e) {
      // Ignore
    }
  }
  chrome.storage.local.set({ backendPort: "8080" });
  return "8080";
}

// Call on startup
detectActivePort();

// Safe chunked converter from ArrayBuffer to Base64 (immune to call stack size limits)
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Pre-fetch HTTP video file and convert to secure base64 Data URL to bypass HTTPS Mixed Content blocks
async function convertUrlToBase64(url) {
  if (!url || !url.startsWith('http')) return url;
  try {
    console.log("Pre-fetching video resource:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    return `data:video/mp4;base64,${base64}`;
  } catch (e) {
    console.warn("Failed to pre-fetch video as base64 blob:", url, e);
    return url; // Fallback to original URL
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Sync the port check if requested
  if (message.action === "get_active_port") {
    detectActivePort().then(port => sendResponse({ port: port }));
    return true;
  }

  if (message.action === "get_player_response") {
    if (!sender.tab || !sender.tab.id) {
      sendResponse({ success: false, error: "No sender tab ID found" });
      return;
    }
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: () => {
        return window.ytInitialPlayerResponse || 
               (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args && window.ytplayer.config.args.raw_player_response);
      },
      world: 'MAIN'
    })
    .then(results => {
      if (results && results[0] && results[0].result) {
        sendResponse({ success: true, data: results[0].result });
      } else {
        sendResponse({ success: false, error: "No player response found in MAIN world" });
      }
    })
    .catch(err => {
      console.error("Failed to execute script in MAIN world:", err);
      sendResponse({ success: false, error: err.toString() });
    });
    return true; // Keep channel open
  }

  if (message.action === "fetch_youtube_caption") {
    console.log("Background fetching YouTube caption track:", message.url);
    fetch(message.url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch caption: ${response.statusText}`);
        }
        return response.text();
      })
      .then(text => {
        sendResponse({ success: true, text: text });
      })
      .catch(err => {
        console.error("Background failed to fetch caption track:", err);
        sendResponse({ success: false, error: err.toString() });
      });
    return true; // Keep channel open
  }

  if (message.action === "fetch_dictionary_lookup") {
    console.log("Background received dictionary lookup request:", message.requestData);

    // Get port from local storage or memory
    chrome.storage.local.get("backendPort", (data) => {
      const port = data.backendPort || activePort;
      console.log(`Using backend port ${port} for lookup`);

      fetch(`http://127.0.0.1:${port}/api/ai/dictionary-lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message.requestData)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(async (data) => {
          console.log("Dictionary lookup response received, converting video paths:", data);

          const processedData = [];
          for (const item of data) {
            if (item.animation && item.animation.startsWith('http')) {
              console.log(`Converting ${item.word} animation to Base64...`);
              const base64Url = await convertUrlToBase64(item.animation);
              processedData.push({
                word: item.word,
                animation: base64Url
              });
            } else {
              processedData.push(item);
            }
          }

          console.log("All video resources converted to Base64 successfully!");
          sendResponse({ success: true, data: processedData });
        })
        .catch(err => {
          console.error("Background dictionary lookup failed:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });

    return true;
  }
});
