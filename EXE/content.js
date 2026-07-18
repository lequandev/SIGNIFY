let trackerStarted = false;
let timeUpdateHandler = null;

// Kiểm tra extension context còn hợp lệ không
function isExtensionValid() {
  try {
    return !!chrome.runtime?.id;
  } catch (e) {
    return false;
  }
}

// Gửi message an toàn - tránh lỗi "Extension context invalidated"
function safeSendMessage(msg) {
  if (!isExtensionValid()) return;
  try {
    chrome.runtime.sendMessage(msg).catch(() => {});
  } catch (e) {
    // Extension đã bị reload, bỏ qua
  }
}

// Hàm lấy ID YouTube (chỉ trả về ID thuần, không kèm URL/đường dẫn)
function getVideoId() {
  // 1) Trang xem thường: youtube.com/watch?v=<ID>
  const v = new URLSearchParams(window.location.search).get('v');
  if (v) return v;

  // 2) Dạng rút gọn / Shorts / embed: /shorts/<ID>, /embed/<ID>, youtu.be/<ID>
  const m = window.location.pathname.match(/\/(?:shorts|embed)\/([\w-]{11})/)
        || window.location.pathname.match(/^\/([\w-]{11})$/);
  if (m) return m[1];

  // Không xác định được ID -> trả rỗng (không gửi cả URL)
  return "";
}

function startTracking(videoElement) {
  if (trackerStarted) return;
  trackerStarted = true;

  // Dùng timeupdate đồng bộ với khung hình video
  // Lưu lại handler để có thể remove khi cần
  timeUpdateHandler = () => {
    if (!isExtensionValid()) {
      // Context đã hết hạn, gỡ listener để tránh lỗi liên tục
      videoElement.removeEventListener('timeupdate', timeUpdateHandler);
      return;
    }
    safeSendMessage({
      type: "VIDEO_TIME",
      currentTime: videoElement.currentTime,
      videoId: getVideoId()
    });
  };
  videoElement.addEventListener('timeupdate', timeUpdateHandler);
}

function waitForVideo() {
  const timer = setInterval(() => {
    const video = document.querySelector("video");
    if (video) {
      clearInterval(timer);
      startTracking(video); // Truyền trực tiếp thẻ video vừa tìm được vào hàm
      startSubtitleObserver(); // Khởi động theo dõi phụ đề
    }
  }, 500);
}

// === THEO DÕI PHỤ ĐỀ YOUTUBE THỜI GIAN THỰC ===
function startSubtitleObserver() {
  let lastSubtitleText = "";
  let debounceTimer = null;

  // Chỉ quan sát đúng vùng caption, không quan sát toàn bộ body
  const targetNode = document.querySelector('.html5-video-player') || document.body;

  // Kiểm tra text có phải là phụ đề thật không
  // (loại bỏ: UI buttons, số đơn lẻ, ký hiệu, text dính số-chữ như "triệu50")
  function isRealCaption(text) {
    if (!text || text.length < 4) return false;

    // Lọc ký hiệu UI phổ biến của YouTube
    if (/^[><!@#$%^&*()\[\]{};:'"\\|,.<>/?`~\-_=+]+/.test(text)) return false;

    // Lọc nếu toàn số hoặc ngắn kiểu "1", "50"
    if (/^\d+$/.test(text.trim())) return false;

    // Lọc text dính số-chữ như "triệu50", "1triệu" (không phải phụ đề thật)
    if (/\d[a-zA-ZÀ-ỹ]|[a-zA-ZÀ-ỹ]\d/.test(text)) return false;

    // Phải có ít nhất 1 chữ cái (tiếng Việt hoặc Latin)
    if (!/[a-zA-ZÀ-ỹ]{2,}/.test(text)) return false;

    // Phải có ít nhất 2 từ (caption thật thường là cả câu)
    // Ngoại trừ một số từ đơn ngắn bị chấp nhận nếu đủ dài
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 2 && text.length < 6) return false;

    return true;
  }

  const observer = new MutationObserver(() => {
    // Chỉ lấy từ đúng selector caption của YouTube
    const captionWindow = document.querySelector('.ytp-caption-window-container') ||
                          document.querySelector('.ytp-caption-region');

    if (!captionWindow) return;

    // Ưu tiên .ytp-caption-segment (text thật của CC)
    let segments = captionWindow.querySelectorAll('.ytp-caption-segment');
    if (segments.length === 0) {
      segments = captionWindow.querySelectorAll('.caption-visual-line span');
    }
    if (segments.length === 0) return; // Không fallback sang span chung nữa — quá dễ bắt nhầm

    const fullText = Array.from(segments)
      .map(el => el.textContent.trim())
      .filter(t => t.length > 0)
      .join(" ")
      .trim();

    // Làm sạch các pattern rõ ràng là UI
    const cleaned = fullText
      .replace(/Tap to unmute/gi, '')
      .replace(/Auto-generated/gi, '')
      .replace(/\d+:\d+(:\d+)?/g, '')         // timestamps
      .replace(/\d+[KkMmBb]?\s*views?/gi, '')  // view counts
      .replace(/\d+\s*(years?|months?|weeks?|days?|hours?|minutes?|seconds?)\s*ago/gi, '')
      .replace(/[»«»›‹>]{2,}/g, '')            // >> << ›› UI arrows
      .trim();

    // Kiểm tra lần cuối: có phải caption thật không
    if (!isRealCaption(cleaned)) return;

    if (cleaned !== lastSubtitleText) {
      lastSubtitleText = cleaned;

      // Debounce 300ms để tránh gửi liên tục khi caption đang transition
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        safeSendMessage({ type: "CAPTION_TEXT", text: cleaned, videoId: getVideoId() });
      }, 300);
    }
  });

  observer.observe(targetNode, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Reset khi caption biến mất
  setInterval(() => {
    const captionWindow = document.querySelector('.ytp-caption-window-container') ||
                          document.querySelector('.ytp-caption-region');
    if (!captionWindow || captionWindow.textContent.trim() === '') {
      if (lastSubtitleText !== '') {
        lastSubtitleText = '';
        safeSendMessage({ type: "CAPTION_TEXT", text: "..." });
      }
    }
  }, 1500);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "RESTART_VIDEO") {
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = 0; // Tua về giây số 0
      video.play();          // Tự động phát video luôn
    }
  }
});

// Khởi động bộ máy
waitForVideo();