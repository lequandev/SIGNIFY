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

  // Cào transcript qua backend (không cần bật CC). Backend tự đọc trang YouTube,
  // lấy caption track và parse thành các đoạn { start, end, text } (ms).
  if (message.action === "fetch_youtube_transcript") {
    chrome.storage.local.get("backendPort", (data) => {
      const port = data.backendPort || activePort;
      const videoId = message.videoId;
      const url = `http://127.0.0.1:${port}/api/ai/youtube-transcript?videoId=${encodeURIComponent(videoId)}`;
      console.log("Background fetching transcript from backend:", url);

      fetch(url, { method: 'GET' })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          sendResponse({ success: true, data: data });
        })
        .catch(err => {
          console.error("Background transcript fetch failed:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });
    return true; // Keep channel open
  }

  if (message.action === "fetch_youtube_caption") {
    console.log("Background fetching YouTube caption track:", message.url);
    
    // Fetch với headers để giả lập browser request
    fetch(message.url, {
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.youtube.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
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

  if (message.action === "fetch_caption_via_api") {
    console.log("Fetching caption via YouTube Data API for video:", message.videoId);
    
    chrome.storage.local.get(['youtube_api_key'], (result) => {
      const apiKey = result.youtube_api_key;
      if (!apiKey) {
        sendResponse({ success: false, error: "YouTube API key not found. Please set it in extension settings." });
        return;
      }

      // YouTube Data API endpoint để lấy caption tracks
      const apiUrl = `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${message.videoId}&key=${apiKey}`;
      
      fetch(apiUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          if (!data.items || data.items.length === 0) {
            throw new Error("No captions found for this video");
          }

          // Tìm caption tiếng Việt hoặc tiếng Anh
          let selectedCaption = data.items.find(item => item.snippet.language === 'vi' || item.snippet.language.startsWith('vi'));
          if (!selectedCaption) {
            selectedCaption = data.items.find(item => item.snippet.language === 'en' || item.snippet.language.startsWith('en'));
          }
          if (!selectedCaption) {
            selectedCaption = data.items[0];
          }

          console.log("Selected caption track:", selectedCaption.snippet.name);

          // YouTube Data API không hỗ trợ download caption trực tiếp
          // Chỉ trả về metadata để sử dụng với direct fetch
          sendResponse({ 
            success: false, 
            error: "YouTube Data API does not support direct caption download. Only metadata is available.",
            captionId: selectedCaption.id,
            captionName: selectedCaption.snippet.name
          });
        })
        .catch(err => {
          console.error("YouTube Data API error:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });
    return true; // Keep channel open
  }

  if (message.action === "set_youtube_api_key") {
    console.log("Setting YouTube API key");
    chrome.storage.local.set({ youtube_api_key: message.apiKey }, () => {
      sendResponse({ success: true });
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
        .then((data) => {
          // Trả thẳng dữ liệu cho content.js (KHÔNG convert base64 tuần tự nữa — trước đây
          // fetch từng mp4 gây trễ lớn, nhất là khi file 404). content.js sẽ tự convert
          // base64 theo nhu cầu (lazy) chỉ cho clip sắp phát, xem convertAnimationsLazily.
          sendResponse({ success: true, data: data });
        })
        .catch(err => {
          console.error("Background dictionary lookup failed:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });

    return true;
  }
});
