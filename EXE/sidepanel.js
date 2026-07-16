let timeline = [];
let started = false;
let currentSegmentIndex = -1;
let isPlayingSequence = false;
let lastVideoTime = -1;
let currentSequenceId = 0;

// Kết nối tới service worker qua port để nhận relay message từ content.js
const swPort = chrome.runtime.connect({ name: "sidepanel" });


const IDLE_CLIP = "signs/dung_im.mp4";
const TARGET_VIDEO_ID = "J7b0jxVB1TE"; // Đã chốt ID của bé Julie
const MAX_FREE_SECONDS = 3600; 

let usedSecondsToday = 0;
let isPremium = false;    
let lastActiveTime = 0; 

const todayStr = new Date().toDateString();

chrome.storage.local.get(['usedSecondsToday', 'lastUsedDate', 'isPremium'], (result) => {
  isPremium = result.isPremium || false;
  if (result.lastUsedDate === todayStr) {
    usedSecondsToday = result.usedSecondsToday || 0;
  } else {
    usedSecondsToday = 0;
    chrome.storage.local.set({ usedSecondsToday: 0, lastUsedDate: todayStr });
  }
});

const video1 = document.getElementById("avatarVideo1");
const video2 = document.getElementById("avatarVideo2");
let activeVideo = video1;
let bufferVideo = video2;

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const upgradeBtnMain = document.getElementById("upgradeBtnMain");
const statusText = document.getElementById("statusText");
const statusDot = document.querySelector(".status-dot");
const statusTimeCount = document.getElementById("statusTimeCount");
const premiumOverlay = document.getElementById("premiumOverlay");
const upgradeBtn = document.getElementById("upgradeBtn");
const premiumMessage = document.getElementById("premiumMessage");
const wordChipsContainer = document.getElementById("wordChipsContainer");

// ===================================================
// 🧠 TÁCH TỪ — Backend AI là nguồn chính.
// Local chỉ còn một splitter tối giản làm fallback khi backend lỗi.
// (Bộ từ điển stopword/compound cũ đã bỏ vì backend đảm nhận việc tách từ.)
// ===================================================

/** Splitter tối giản: tách theo khoảng trắng, bỏ dấu câu bao quanh và token quá ngắn. */
function splitTextIntoWords(text) {
  if (!text) return [];
  return text
    .split(/\s+/)
    .map(w => w.replace(/^[.,!?;:"'()\-–—]+|[.,!?;:"'()\-–—]+$/g, '').trim())
    .filter(w => w.length >= 2 && !/^\d+$/.test(w));
}

// Gọi backend AI để tách từ bằng AI
async function processTextWithAI(text, videoId) {
  try {
    // Chuẩn bị local words làm fallback
    const localWords = splitTextIntoWords(text);

    const response = await fetch('http://localhost:8080/api/ai/dictionary-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId: videoId || TARGET_VIDEO_ID,
        words: localWords, // Gửi local words làm fallback
        text: text // Backend sẽ dùng AI để enhance
      })
    });

    if (!response.ok) {
      console.error('Backend AI API failed:', response.status);
      return null;
    }

    const data = await response.json();
    // Trả về danh sách các từ từ AI
    return data.map(item => item.word);
  } catch (error) {
    console.error('Error calling backend AI:', error);
    return null;
  }
}

// Video "đứng yên" hiển thị trong khung phụ đề lúc trống (chưa/không có phụ đề).
const IDLE_SUBTITLE_VIDEO = "signs/dung_im.mp4";

// Hiển thị video dung-im lặp trong khung phụ đề. Chỉ tạo lại nếu chưa có sẵn
// (tránh video bị giật/khởi động lại mỗi lần caption trống liên tục).
function showIdleSubtitleVideo() {
  if (!wordChipsContainer) return;
  if (wordChipsContainer.querySelector("video.idle-sign-video")) return;
  const url = chrome.runtime.getURL(IDLE_SUBTITLE_VIDEO);
  wordChipsContainer.innerHTML =
    `<video class="idle-sign-video" src="${url}" autoplay loop muted playsinline></video>`;
}

// Render danh sách từ thành word chips
async function renderWordChips(text, videoId = null) {
  if (!wordChipsContainer) return;

  if (!text || text === "...") {
    showIdleSubtitleVideo();
    return;
  }

  // Thử gọi backend AI trước
  let words = await processTextWithAI(text, videoId);

  // Fallback về local nếu AI thất bại
  if (!words || words.length === 0) {
    words = splitTextIntoWords(text);
  }

  if (words.length === 0) {
    showIdleSubtitleVideo();
    return;
  }

  // Mỗi từ = 1 chip, animation stagger nhẹ
  wordChipsContainer.innerHTML = words
    .map((w, idx) =>
      `<span class="word-chip" style="animation-delay:${idx * 40}ms">${w}</span>`
    )
    .join('');
}

activeVideo.src = chrome.runtime.getURL(IDLE_CLIP);
activeVideo.play().catch(() => {});

setInterval(() => {
  if (!started || isPremium) return;
  if (Date.now() - lastActiveTime < 2000) {
    usedSecondsToday++;
    if (usedSecondsToday % 5 === 0) chrome.storage.local.set({ usedSecondsToday: usedSecondsToday });
    if (usedSecondsToday >= MAX_FREE_SECONDS) {
      triggerPremiumWall("Bạn đã sử dụng hết 1 giờ dùng thử hôm nay. Vui lòng nâng cấp PRO!");
    }
  }
}, 1000);

function setStatus(text, state = "inactive") {
  statusText.textContent = text;
  statusDot.classList.remove("active", "ai-waiting");
  if (state === "active") statusDot.classList.add("active");
  else if (state === "ai") statusDot.classList.add("ai-waiting");
}

async function loadTimeline() {
  const res = await fetch(chrome.runtime.getURL("timeline.json"));
  timeline = await res.json();
}

// ========================================================
// 🏆 LOGIC MỚI: TÌM ĐIỂM KÍCH NỔ (BỎ QUA THỜI GIAN END)
// ========================================================
function findSegmentIndex(currentTime) {
  let activeIdx = -1;
  for (let i = 0; i < timeline.length; i++) {
    const leadTime = timeline[i].lead || 0;
    // Nếu video YouTube đã chạy qua vạch Start của câu này
    if (currentTime >= (timeline[i].start - leadTime)) {
      activeIdx = i; // Cứ ghi nhận câu mới nhất
    }
  }
  return activeIdx;
}

function preloadClip(videoElement, clipPath) {
  return new Promise((resolve) => {
    const clipUrl = chrome.runtime.getURL(clipPath);
    videoElement.src = clipUrl;
    videoElement.load();
    videoElement.oncanplaythrough = () => resolve();
    videoElement.onerror = () => resolve(); 
  });
}

function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function broadcastToFullscreen(videoUrl, isLooping) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "SYNC_AVATAR", src: videoUrl, loop: isLooping
      }).catch(() => {});
    }
  });
}

function triggerPremiumWall(msg) {
  isPlayingSequence = false;
  activeVideo.pause();
  premiumOverlay.classList.remove("hidden");
  if (msg) premiumMessage.textContent = msg;
  setStatus("Tạm dừng AI - Yêu cầu nâng cấp", "inactive");
  statusTimeCount.textContent = ""; 
  startBtn.classList.remove("running");
  startBtn.textContent = "Dịch";
}

function playIdle() {
  currentSequenceId++;
  isPlayingSequence = false;
  activeVideo.src = chrome.runtime.getURL(IDLE_CLIP);
  activeVideo.loop = true; 
  activeVideo.play().catch(() => {});
  broadcastToFullscreen(activeVideo.src, true);
  activeVideo.classList.remove("hidden");
  activeVideo.classList.add("active");
  bufferVideo.classList.add("hidden");
}

async function playSequence(segment) {
  if (!segment || !segment.clips || !segment.clips.length) return;
  currentSequenceId++;
  const mySequenceId = currentSequenceId;
  isPlayingSequence = true;

  for (let i = 0; i < segment.clips.length; i++) {
    if (mySequenceId !== currentSequenceId) return;
    const currentClip = segment.clips[i];
    const nextClip = segment.clips[i + 1];
    if (nextClip) preloadClip(bufferVideo, nextClip);

    setStatus(`Đang dịch câu...`, "active");

    await new Promise((resolve) => {
      activeVideo.src = chrome.runtime.getURL(currentClip);
      activeVideo.loop = false; 
      
      // Khi video múa XONG TỰ NHIÊN, nó sẽ chuyển tiếp
      activeVideo.onended = () => resolve();
      activeVideo.play().catch(() => resolve());
      
      broadcastToFullscreen(activeVideo.src, false);
      activeVideo.classList.remove("hidden");
      activeVideo.classList.add("active");
      bufferVideo.classList.add("hidden");
    });
    const temp = activeVideo; activeVideo = bufferVideo; bufferVideo = temp;
  }
  
  // KIỂM TRA QUAN TRỌNG: Chỉ khi nào múa HẾT TẤT CẢ video trong câu mới về nghỉ
  if (mySequenceId === currentSequenceId) {
    setStatus(`AI đang sẵn sàng...`, "ai");
    playIdle(); 
  }
}

// Lắng nghe message từ service worker (relay từ content.js)
swPort.onMessage.addListener((message) => {
  // === PHỤ ĐỀ THỜI GIAN THỰC cho người điếc ===
  // Hiển thị text tách từ YouTube caption ngay lập tức, không cần đợi bấm Dịch
  if (message.type === "CAPTION_TEXT") {
    // Tách từ và render chips cho người điếc - gửi text và videoId đến backend AI
    renderWordChips(message.text, message.videoId);
    return;
  }

  if (message.type !== "VIDEO_TIME" || !started) return;

  const sender = message._sender; // không có sender ở đây nhưng giữ logic cũ

  if (!isPremium && message.videoId !== TARGET_VIDEO_ID) {
    triggerPremiumWall("Gói FREE hiện chỉ hỗ trợ video mẫu. Vui lòng nâng cấp gói PRO!");
    return;
  }

  if (!isPremium && usedSecondsToday >= MAX_FREE_SECONDS) {
    triggerPremiumWall("Hệ thống đã đạt giới hạn 1 giờ dùng thử hôm nay.");
    return;
  }

  lastActiveTime = Date.now();
  const currentTime = message.currentTime;
  statusTimeCount.textContent = `[${formatTime(currentTime)}]`;

  const isSeeking = Math.abs(currentTime - lastVideoTime) > 2.0 && lastVideoTime !== -1;
  lastVideoTime = currentTime;

  const newIndex = findSegmentIndex(currentTime);
  
  if (isSeeking || newIndex !== currentSegmentIndex) {
    currentSegmentIndex = newIndex;
    if (newIndex !== -1) {
      playSequence(timeline[newIndex]);
    } else {
      setStatus(`AI đang lắng nghe...`, "ai");
      playIdle(); 
    }
  }
});


startBtn.addEventListener("click", async () => {
  if (started) return;
  try {
    premiumOverlay.classList.add("hidden");
    setStatus("Đang khởi động AI...", "ai");
    startBtn.classList.add("running");
    startBtn.textContent = "Đang chạy...";

    await loadTimeline();
    started = true;
    currentSegmentIndex = -1;
    lastVideoTime = -1;
    
    playIdle(); 
    setStatus("Hệ thống đã kết nối!", "ai");
  } catch (err) {
    setStatus("Lỗi tải dữ liệu", "inactive");
    startBtn.classList.remove("running"); 
    startBtn.textContent = "Dịch";
  }
});

restartBtn.addEventListener("click", () => {
  if (started) {
    currentSequenceId++;
    currentSegmentIndex = -1; 
    lastVideoTime = -1;
    isPlayingSequence = false;
    
    setStatus("AI đang tải lại video...", "ai");
    playIdle(); 

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) chrome.tabs.sendMessage(tabs[0].id, { action: "RESTART_VIDEO" });
    });
  }
});

function handleUpgrade() {
  started = false;
  isPlayingSequence = false;
  currentSequenceId++; 
  activeVideo.src = chrome.runtime.getURL(IDLE_CLIP);
  activeVideo.play().catch(() => {});
  startBtn.classList.remove("running");
  startBtn.textContent = "Dịch";
  setStatus("Đang chờ nâng cấp...", "inactive");
  statusTimeCount.textContent = "";
  chrome.tabs.create({ url: "http://localhost:5173/packages" }); 
}

upgradeBtnMain.addEventListener("click", handleUpgrade);
upgradeBtn.addEventListener("click", handleUpgrade);