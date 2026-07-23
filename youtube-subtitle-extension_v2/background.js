// Signify Chrome Extension - Background Service Worker
console.log("Signify Background Service Worker initialized!");

// Production backend URL (Render). Change this if the backend is redeployed elsewhere.
const BACKEND_URL = "https://signify-g3zb.onrender.com";

// Health-check the backend. Returns true if reachable.
async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    // Render free tier can cold-start (~50s), so allow a generous timeout.
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const res = await fetch(`${BACKEND_URL}/api/ai/dictionary-lookup`, {
      method: 'OPTIONS',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return true;
  } catch (e) {
    console.warn("Backend health-check failed:", e);
    return false;
  }
}

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
  // Backend health-check if requested
  if (message.action === "get_active_port") {
    checkBackendHealth().then(online => sendResponse({ online: online, backendUrl: BACKEND_URL }));
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
    const videoId = message.videoId;
    const url = `${BACKEND_URL}/api/ai/youtube-transcript?videoId=${encodeURIComponent(videoId)}`;
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

  if (message.action === "usage_session_start") {
    chrome.storage.local.get(["signifyAuthToken"], (data) => {
      const token = data.signifyAuthToken;

      if (!token) {
        sendResponse({
          success: false,
          quotaExceeded: false,
          authRequired: true,
          error: "Vui lòng đăng nhập Signify để sử dụng extension."
        });
        return;
      }

      fetch(`${BACKEND_URL}/api/v1/usage-sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(message.requestData || {})
      })
        .then(async response => {
          const data = await response.json().catch(() => ({}));
          if (response.status === 403 && data.code === 'FREE_DAILY_LIMIT_REACHED') {
            sendResponse({ success: false, quotaExceeded: true, data });
            return;
          }
          if (!response.ok) {
            sendResponse({ success: false, error: data.message || `HTTP error! Status: ${response.status}` });
            return;
          }
          sendResponse({ success: true, data });
        })
        .catch(err => {
          console.error("Usage session start failed:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });
    return true;
  }

  if (message.action === "usage_session_heartbeat") {
    chrome.storage.local.get(["signifyAuthToken"], (data) => {
      const token = data.signifyAuthToken;

      if (!token) {
        sendResponse({ success: false, authRequired: true, error: "Vui lòng đăng nhập Signify để sử dụng extension." });
        return;
      }

      fetch(`${BACKEND_URL}/api/v1/usage-sessions/${encodeURIComponent(message.sessionId)}/heartbeat`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(async response => {
          const data = await response.json().catch(() => ({}));
          if (response.status === 403 && data.code === 'FREE_DAILY_LIMIT_REACHED') {
            sendResponse({ success: false, quotaExceeded: true, data });
            return;
          }
          if (!response.ok) {
            sendResponse({ success: false, error: data.message || `HTTP error! Status: ${response.status}` });
            return;
          }
          sendResponse({ success: true, data });
        })
        .catch(err => {
          console.error("Usage session heartbeat failed:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });
    return true;
  }

  if (message.action === "usage_session_end") {
    chrome.storage.local.get(["signifyAuthToken"], (data) => {
      const token = data.signifyAuthToken;

      if (!token || !message.sessionId) {
        sendResponse({ success: false, error: "Missing token or sessionId" });
        return;
      }

      fetch(`${BACKEND_URL}/api/v1/usage-sessions/${encodeURIComponent(message.sessionId)}/end`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(async response => {
          const data = await response.json().catch(() => ({}));
          sendResponse({ success: response.ok, data, error: response.ok ? null : data.message });
        })
        .catch(err => {
          console.error("Usage session end failed:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });
    return true;
  }

  if (message.action === "fetch_dictionary_lookup") {
    console.log("Background received dictionary lookup request:", message.requestData);

    // Get auth token from local storage
    chrome.storage.local.get(["signifyAuthToken"], (data) => {
      const token = data.signifyAuthToken;

      if (!token) {
        sendResponse({
          success: false,
          authRequired: true,
          error: "Vui lòng đăng nhập Signify để sử dụng extension."
        });
        return;
      }

      fetch(`${BACKEND_URL}/api/ai/dictionary-lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(message.requestData)
      })
        .then(async response => {
          const data = await response.json().catch(() => ({}));
          if (response.status === 403 && data.code === 'FREE_DAILY_LIMIT_REACHED') {
            sendResponse({ success: false, quotaExceeded: true, data });
            return;
          }
          if (response.status === 401) {
            sendResponse({ success: false, authRequired: true, data, error: data.message || 'Vui lòng đăng nhập Signify để sử dụng extension.' });
            return;
          }
          if (!response.ok) {
            sendResponse({ success: false, error: data.message || `HTTP error! Status: ${response.status}` });
            return;
          }
          sendResponse({ success: true, data: data });
        })
        .catch(err => {
          console.error("Background dictionary lookup failed:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });

    return true;
  }

  if (message.action === "get_video_info") {
    const videoId = message.videoId;
    console.log(`📡 [Signify BG] Nhận yêu cầu GET video info cho videoId: ${videoId}`);
    chrome.storage.local.get(["signifyAuthToken"], (data) => {
      const token = data.signifyAuthToken;
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${BACKEND_URL}/api/youtube/video-info/${encodeURIComponent(videoId)}`;
      console.log(`🌐 [Signify BG] Đang gửi GET request đến BE: ${url}`);

      fetch(url, {
        method: 'GET',
        headers: headers
      })
        .then(async (res) => {
          if (res.status === 404) {
            console.log(`⚠️ [Signify BG] VideoId '${videoId}' chưa có dữ liệu trên BE (404 Not Found)`);
            sendResponse({ success: false, notFound: true });
            return;
          }
          const resData = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.warn(`❌ [Signify BG] BE trả lỗi khi GET video info (${res.status}):`, resData);
            sendResponse({ success: false, status: res.status, data: resData });
            return;
          }
          console.log(`✅ [Signify BG] Kết quả GET video info thành công cho videoId '${videoId}':`, resData);
          sendResponse({ success: true, data: resData });
        })
        .catch(err => {
          console.error(`❌ [Signify BG] Lỗi kết nối khi GET video info:`, err);
          sendResponse({ success: false, error: err.toString() });
        });
    });

    return true;
  }

  if (message.action === "save_video_info") {
    const videoData = message.data || {};
    chrome.storage.local.get(["signifyAuthToken"], (data) => {
      const token = data.signifyAuthToken;
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${BACKEND_URL}/api/youtube/video-info`;
      console.log("Sending video info to backend:", url, videoData);

      fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(videoData)
      })
        .then(async (res) => {
          const resData = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.warn("Save video info backend response non-200:", res.status, resData);
            sendResponse({ success: false, status: res.status, data: resData });
            return;
          }
          console.log("✅ Video info successfully saved on backend:", resData);
          sendResponse({ success: true, data: resData });
        })
        .catch(err => {
          console.error("Save video info request failed:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });

    return true;
  }

  // ═══════════════════════════════════════════════════════════════════
  // FULL SIGN SEQUENCE — Lưu duy nhất signLanguageText lên BE
  // ═══════════════════════════════════════════════════════════════════
  //
  // Được gọi từ content.js 1 LẦN DUY NHẤT khi user chuyển sang video khác.
  // Lúc đó mảng fullSignSequence đã tích lũy đầy đủ → ghép các `word` ngăn
  // cách bằng dấu phẩy ", " → gửi duy nhất trường `signLanguageText` lên BE.
  //
  // ─── API Contract cho BE ───────────────────────────────────────────
  //
  //   POST /api/ai/sign-sequence
  //   Authorization: Bearer <token>    (optional nếu user chưa đăng nhập)
  //   Content-Type: application/json
  //
  // ─── Request Body ──────────────────────────────────────────────────
  //
  //   {
  //     "signLanguageText": "thi, môn cua, cấp trường, ra, động viên, bạn ấy, buồn, hôm nay, đạt giải, mọi người, kỳ vọng, tớ, làm thất vọng, bố mẹ, thầy cô, các bạn, cố gắng, đừng tự trách, đi về, cùng chúng mình, thật tuyệt, cảm ơn, ấn thích, chia sẻ, bấm nút, đăng ký kênh, xem, video mới nhất"
  //   }
  //
  // ─── Response mong đợi (200 OK) ────────────────────────────────────
  //
  //   { "success": true, "message": "Saved successfully" }
  // ═══════════════════════════════════════════════════════════════════
  if (message.action === "send_full_sign_sequence") {
    const sequenceData = message.data || {};
    console.log(
      `📚 [Signify BG] Nhận fullSignSequence từ content.js:`,
      `videoId=${sequenceData.videoId},`,
      `tổng ${(sequenceData.fullSignSequence || []).length} ký hiệu`
    );

    chrome.storage.local.get(["signifyAuthToken"], (data) => {
      const token = data.signifyAuthToken;
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch(`${BACKEND_URL}/api/ai/sign-sequence`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(sequenceData)
      })
        .then(async (res) => {
          const resData = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.warn("[Signify BG] sign-sequence BE trả lỗi:", res.status, resData);
            sendResponse({ success: false, status: res.status, data: resData });
            return;
          }
          console.log("✅ [Signify BG] fullSignSequence saved on BE:", resData);
          sendResponse({ success: true, data: resData });
        })
        .catch(err => {
          console.error("[Signify BG] send_full_sign_sequence request failed:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });

    return true; // Keep message channel open for async response
  }
});
