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
// 🧠 ENGINE TÁCH TỪ CHO NGÔN NGỮ NGƯỜI ĐIẾC (v2)
// ===================================================

const VIETNAMESE_STOPWORDS = new Set([
  // Hư từ / liên từ / giới từ
  "là", "và", "hoặc", "nhưng", "tuy", "tuy nhiên", "thế nhưng",
  "tại", "do", "bởi", "vì", "để", "cho", "của", "với", "về",
  "trong", "ngoài", "trên", "dưới", "sau", "trước", "giữa", "bên",
  "từ", "đến", "tới", "qua", "về", "theo",
  // Trợ từ / tiểu từ
  "thì", "mà", "là", "đó", "này", "kia", "nọ", "ấy",
  "nè", "nha", "nhé", "nhỉ", "thôi", "vậy", "vậy thôi",
  "à", "ơi", "ớ", "ừ", "ừm", "ờm", "dạ", "vâng", "ạ",
  // Đại từ
  "tôi", "mình", "ta", "tớ", "cậu", "bạn", "nó", "họ", "chúng",
  "anh", "chị", "em", "ông", "bà", "cô", "chú",
  // Phó từ chỉ mức độ
  "rất", "quá", "lắm", "hơi", "cực", "kỳ", "siêu", "khá",
  // Thì / thể động từ
  "đã", "đang", "sẽ", "vừa", "mới", "đang", "cũng",
  // Khác
  "như", "còn", "lại", "nơi", "nào", "gì", "ai", "đâu",
  "sao", "bao", "các", "kiểu", "cơ", "đấy", "thế", "rồi", "hơn"
]);

// Từ điển từ ghép – sắp xếp từ DÀI đến NGẮN để scan greedy đúng
// (3-4 từ trước, rồi 2 từ)
const COMPOUND_WORDS = [
  // 4 từ
  "trí tuệ nhân tạo", "học máy học sâu",
  "cơm chiên hải sản", "canh chua cá lóc",
  "thịt kho tàu hột vịt",

  // 3 từ
  "hướng dẫn cách làm", "hướng dẫn nấu ăn",
  "cách làm tại nhà", "tại nhà đơn giản",
  "ngon và dễ", "dễ làm tại nhà",
  "không có gì", "không biết gì",
  "như thế nào", "bao nhiêu tiền",
  "cảm ơn các bạn", "xin chào mọi người",
  "chào mừng các bạn", "hôm nay mình",
  "ngày hôm nay", "ngày hôm qua",

  // 2 từ – ẩm thực / nấu ăn
  "cơm chiên", "hải sản", "cơm trắng",
  "canh chua", "nước mắm", "rau sống",
  "thịt bò", "thịt gà", "thịt heo", "thịt lợn",
  "cá hồi", "cá thu", "cá ngừ", "cá lóc",
  "tôm tươi", "mực tươi", "cua biển",
  "rau muống", "rau cải", "giá đỗ",
  "bột mì", "dầu ăn", "bơ sữa",
  "hành tây", "hành lá", "tỏi băm", "ớt tươi",
  "xì dầu", "nước tương", "dấm gạo",
  "bánh mì", "phở bò", "bún bò", "hủ tiếu",
  "chả giò", "nem cuốn", "bánh xèo",
  "nước dừa", "nước lọc", "trà sữa",
  "kem tươi", "bánh ngọt", "trái cây",
  "dễ làm", "ngon lành", "thơm ngon", "đơn giản",
  "nấu chín", "chiên vàng", "hấp chín", "nướng thơm",
  "ướp thịt", "xào đều", "khuấy đều",

  // 2 từ – chào hỏi / giao tiếp
  "xin chào", "mọi người", "chào mừng",
  "xin lỗi", "cảm ơn", "tạm biệt", "làm ơn",
  "không sao", "được không", "có không",
  "thế nào", "bao nhiêu", "bao lâu", "bao xa",
  "đúng rồi", "đúng vậy", "được rồi",
  "tốt lắm", "hay lắm", "đẹp lắm",
  "một chút", "một lúc",

  // 2 từ – động từ ghép
  "hướng dẫn", "chia sẻ", "giới thiệu", "nói chuyện",
  "tham khảo", "thử nghiệm", "kiểm tra", "đánh giá",
  "mua sắm", "tiết kiệm", "đầu tư", "kinh doanh",
  "học tập", "nghiên cứu", "phát triển", "sáng tạo",
  "chuẩn bị", "bắt đầu", "tiếp tục", "hoàn thành",
  "thực hiện", "sử dụng", "áp dụng", "thay đổi",
  "mở rộng", "thu hẹp", "tăng cường", "giảm bớt",
  "đi làm", "đi học", "đi chợ", "đi chơi",
  "về nhà", "ra ngoài", "vào trong", "lên trên", "xuống dưới",
  "nghe nói", "nghe thấy", "nói rằng", "nói với",
  "đứng lên", "ngồi xuống", "mở ra", "đóng lại",

  // 2 từ – cảm xúc / tính từ
  "vui vẻ", "hạnh phúc", "buồn bã", "lo lắng",
  "hồi hộp", "ngạc nhiên", "thích thú", "hài lòng",
  "khó khăn", "đơn giản", "phức tạp", "thú vị",
  "quan trọng", "cần thiết", "đặc biệt", "tuyệt vời",
  "đẹp lắm", "ngon lắm",

  // 2 từ – thời gian / địa điểm
  "hôm nay", "ngày mai", "hôm qua", "tuần sau",
  "buổi sáng", "buổi trưa", "buổi tối", "ban đêm",
  "tại nhà", "ở nhà", "ngoài đường", "trong bếp",
  "siêu thị", "chợ trời", "nhà hàng", "quán ăn",
  "thành phố", "nông thôn", "miền nam", "miền bắc",

  // 2 từ – công nghệ / mạng xã hội
  "mạng xã hội", "điện thoại", "máy tính", "phần mềm",
  "ứng dụng", "nội dung", "video clip", "kênh youtube",
  "subscribe kênh", "like share", "bình luận",
  "trực tuyến", "ngoại tuyến", "kết nối", "internet",
  "trí tuệ", "nhân tạo", "học máy", "dữ liệu",

  // 2 từ – gia đình / quan hệ
  "gia đình", "bạn bè", "người thân",
  "anh ấy", "chị ấy", "em ấy", "bạn ấy",
  "của tôi", "của bạn", "của anh", "của chị", "của em",

  // 2 từ – số lượng / mức độ
  "tất cả", "hầu hết", "một số", "nhiều lắm",
  "ít thôi", "vừa đủ", "quá nhiều", "không đủ",
  "có thể", "có lẽ", "chắc chắn", "thực sự",
  "không được", "không thể", "không có", "không biết",
  "rất tốt", "rất đẹp", "rất hay", "rất vui", "rất buồn",
];

/**
 * Tách văn bản thành danh sách token có nghĩa.
 * Thuật toán: greedy scan từ trái sang phải,
 * ưu tiên khớp từ ghép dài nhất tại mỗi vị trí.
 */
function splitTextIntoWords(text) {
  if (!text) return [];

  // Chuẩn hóa: chữ thường, bỏ dấu câu ở đầu/cuối mỗi token
  const normalized = text.toLowerCase().trim();
  const tokenArr = normalized.split(/\s+/); // tách thành mảng từ đơn

  const result = [];
  let i = 0;

  while (i < tokenArr.length) {
    let matched = false;

    // Thử khớp từ ghép dài nhất từ vị trí i
    // COMPOUND_WORDS đã sắp xếp dài → ngắn
    for (const compound of COMPOUND_WORDS) {
      const compTokens = compound.split(/\s+/);
      const len = compTokens.length;

      if (i + len > tokenArr.length) continue;

      // So sánh từng token (sau khi strip dấu câu)
      const slice = tokenArr.slice(i, i + len)
        .map(w => w.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, ''));
      const compClean = compTokens
        .map(w => w.replace(/^[.,!?;:"'()]+|[.,!?;:"'()]+$/g, ''));

      if (slice.join(' ') === compClean.join(' ')) {
        result.push(compound); // giữ nguyên từ ghép đẹp
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Không khớp từ ghép → xử lý từ đơn
      const raw = tokenArr[i];
      // Bỏ dấu câu bao quanh
      const clean = raw.replace(/^[.,!?;:"'()\-–—]+|[.,!?;:"'()\-–—]+$/g, '');
      i++;

      if (!clean) continue;
      if (/^\d+$/.test(clean)) continue;          // bỏ số thuần túy
      if (clean.length < 2) continue;              // bỏ 1 ký tự
      if (VIETNAMESE_STOPWORDS.has(clean)) continue; // bỏ stopword

      result.push(clean);
    }
  }

  return result;
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

// Render danh sách từ thành word chips
async function renderWordChips(text, videoId = null) {
  if (!wordChipsContainer) return;

  if (!text || text === "...") {
    wordChipsContainer.innerHTML = '<span class="subtitle-placeholder">Chờ phụ đề...</span>';
    return;
  }

  // Thử gọi backend AI trước
  let words = await processTextWithAI(text, videoId);

  // Fallback về local nếu AI thất bại
  if (!words || words.length === 0) {
    words = splitTextIntoWords(text);
  }

  if (words.length === 0) {
    wordChipsContainer.innerHTML = '<span class="subtitle-placeholder">Chờ phụ đề...</span>';
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