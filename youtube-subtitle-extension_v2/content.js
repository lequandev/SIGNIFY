// Signify Chrome Extension - Content Script (Premium Timeline-Based Sync Engine)
(function () {
  console.log("Signify Extension successfully injected on YouTube Watch Page!");

  // Local Word Dictionary - Inline for immediate availability
  const VIETNAMESE_STOPWORDS = new Set([
    "nè", "nha", "nhé", "nhỉ", "à", "ơi", "ớ", "ừ", "dạ", "vâng", "bạn", "các", "kiểu", "cơ", "đấy", "thế",
    "này", "kia", "nọ", "nhe", "nha", "ờ", "ờm", "thì", "mà",
    "là", "còn", "và", "hoặc", "nhưng", "tuy", "tại", "do", "bởi", "đang", "đã", "vừa", "mới", "sẽ",
    "cũng", "như", "nó", "họ", "chúng", "mình", "tôi", "tớ", "ta", "cậu", "chúng tôi", "chúng ta",
    "này", "đó", "ấy", "rồi", "lại", "nơi", "nào", "gì", "ai", "đâu", "sao", "bao", "quá", "rất", "lắm", "hơi",
    "cực", "kỳ", "món", "để", "cho", "hơn",
    ">>", "<<", "->", "=>", "http", "https", ">", "<", "các kiểu"
  ]);

  const COMPOUND_WORDS = new Set([
    "xin chào", "mọi người", "chào mừng", "hôm nay", "ngày mai", "ngày hôm qua",
    "trí tuệ nhân tạo", "cuộc sống hiện đại", "khoa học công nghệ", "công nghệ thông tin",
    "mạng xã hội", "học máy", "dữ liệu lớn", "xử lý ngôn ngữ", "tìm hiểu", "thay đổi", "phát triển",
    "canh chua", "nước mắm", "chua chua", "dễ ăn", "các kiểu",
    "xin lỗi", "cảm ơn", "tạm biệt", "làm ơn", "không sao", "được không",
    "thế nào", "như thế nào", "bao nhiêu", "bao lâu", "bao xa",
    "rất tốt", "rất đẹp", "rất hay", "rất vui", "rất buồn",
    "không được", "không thể", "không có", "không biết",
    "có thể", "có lẽ", "có lẽ là", "được rồi", "được rồi",
    "một chút", "một chút nữa", "một chút thôi",
    "đúng rồi", "đúng vậy", "đúng như vậy",
    "tốt lắm", "hay lắm", "đẹp lắm", "buồn lắm",
    "nghe nói", "nghe đâu", "nghe thấy",
    "nói rằng", "nói là", "nói với",
    "đi cùng", "đi với", "đi tới", "đi về",
    "lên trên", "xuống dưới", "vào trong", "ra ngoài",
    "đứng lên", "ngồi xuống", "nằm xuống",
    "mở ra", "đóng lại", "tắt đi", "bật lên",
    "đến đây", "đi đó", "về đây", "về nhà",
    "của tôi", "của bạn", "của anh", "của chị", "của em",
    "của chúng ta", "của chúng tôi", "của họ",
    "anh ấy", "chị ấy", "em ấy", "bạn ấy", "nó"
  ]);

  function stripVietnameseAccents(str) {
    if (!str) return "";
    const normalized = str.normalize("NFD");
    const pattern = /[\u0300-\u036f]/g;
    return normalized.replace(pattern, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  }

  // Loại bỏ nội dung trong ngoặc vuông, ngoặc kép, ngoặc đơn (như [âm nhạc], <<...>>, (...))
  function filterBracketedContent(text) {
    if (!text || text.trim().length === 0) return text;
    // Loại bỏ [nội dung], <<nội dung>>, (nội dung)
    let cleaned = text.replace(/\[.*?\]/g, "")
      .replace(/<<.*?>>/g, "")
      .replace(/\(.*?\)/g, "");
    // Dọn dẹp khoảng trắng thừa sau khi xóa
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    return cleaned;
  }

  // Từ viết tắt: >=2 ký tự, mọi chữ cái đều viết HOA (AI, GDP, USA...). Luôn giữ lại.
  function isAcronym(word) {
    if (!word || word.length < 2) return false;
    let hasLetter = false;
    for (const ch of word) {
      if (/[a-zA-ZÀ-ỹ]/.test(ch)) {
        hasLetter = true;
        if (ch === ch.toLowerCase() && ch !== ch.toUpperCase()) return false;
      }
    }
    return hasLetter;
  }

  // Một token được giữ lại nếu không rỗng và không phải stopword; acronym luôn được giữ
  // (kể cả khi bản chữ thường trùng stopword, ví dụ "AI" -> "ai").
  function isMeaningfulWord(word) {
    if (!word) return false;
    const clean = word.trim();
    if (!clean) return false;
    if (isAcronym(clean)) return true;
    return !VIETNAMESE_STOPWORDS.has(clean.toLowerCase());
  }

  // Gộp các câu lặp liền kề (ASR hay nhân đôi câu). So khớp không phân biệt hoa/thường.
  function dedupeRepeatedSentences(text) {
    if (!text) return text;
    const parts = text.split(/(?<=[.?!])\s+/);
    const out = [];
    for (const p of parts) {
      const norm = p.trim().toLowerCase();
      if (!norm) continue;
      const prev = out.length ? out[out.length - 1].trim().toLowerCase() : null;
      if (norm !== prev) out.push(p.trim());
    }
    return out.join(" ").trim();
  }

  // Khi ASR cuộn, đầu câu mới có thể trùng đuôi câu cũ. Cắt phần trùng đó, chỉ giữ phần mới.
  function stripOverlapPrefix(prev, current) {
    const prevWords = prev.toLowerCase().split(/\s+/);
    const curWords = current.split(/\s+/);
    const curLower = curWords.map(w => w.toLowerCase());
    // Tìm overlap dài nhất: hậu tố của prev == tiền tố của current.
    let maxOverlap = 0;
    const limit = Math.min(prevWords.length, curWords.length);
    for (let k = 1; k <= limit; k++) {
      let match = true;
      for (let j = 0; j < k; j++) {
        if (prevWords[prevWords.length - k + j] !== curLower[j]) { match = false; break; }
      }
      if (match) maxOverlap = k;
    }
    return curWords.slice(maxOverlap).join(" ").trim();
  }

  function splitTextIntoWords(text) {
    if (!text) return [];

    const words = [];
    // Chuẩn hóa nhẹ nhưng GIỮ chữ hoa để nhận diện acronym; so khớp cụm bằng bản chữ thường.
    const cleaned = text.replace(/[.,;:!?"()\[\]]/g, " ").replace(/\s+/g, " ").trim();
    const tokens = cleaned.split(" ");
    const lowerTokens = tokens.map(t => t.toLowerCase());

    const sortedCompoundWords = Array.from(COMPOUND_WORDS).sort((a, b) => b.length - a.length);

    let i = 0;
    while (i < tokens.length) {
      let matched = false;
      for (const compound of sortedCompoundWords) {
        const compTokens = compound.split(" ");
        if (i + compTokens.length <= lowerTokens.length) {
          let allMatch = true;
          for (let k = 0; k < compTokens.length; k++) {
            if (lowerTokens[i + k] !== compTokens[k]) { allMatch = false; break; }
          }
          if (allMatch) {
            words.push(compound);
            i += compTokens.length;
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        const token = tokens[i];
        if (isMeaningfulWord(token)) {
          words.push(isAcronym(token) ? token : token.toLowerCase());
        }
        i++;
      }
    }

    return words;
  }

  // Production URLs (Render). Change these if BE/FE are redeployed elsewhere.
  const BACKEND_URL = "https://signify-g3zb.onrender.com";
  const FRONTEND_URL = "https://signify-i3rd.onrender.com";
  // Signify logo bundled with the extension (used in rail toggle + modal).
  const LOGO_URL = (chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL("icons/logo.png") : "";

  // LOCAL_DEMO_SIGNS: video bundle sẵn trong extension (chỉ .mp4 — Chrome không chạy .mov).
  // Ưu tiên local để tránh network request; từ không có local sẽ fallback sang Cloudinary/backend.
  const LOCAL_DEMO_SIGNS = {
    "ly do":        "demo/signs-v3/ly-do.mp4",
    "khong":        "demo/signs-v3/khong.mp4",
    "dat giai":     "demo/signs-v3/gioi.mp4",
    "gioi":         "demo/signs-v3/gioi.mp4",
    "cac ban":      "demo/signs-v3/cac-ban.mp4",
    "ban":          "demo/signs-v3/cac-ban.mp4",
    "tin tuong":    "demo/signs-v3/tin-tuong.mp4",
    "ky vong":      "demo/signs-v3/tin-tuong.mp4",
    "toi":          "demo/signs-v3/toi.mp4",
    "to":           "demo/signs-v3/toi.mp4",
    "co gang":      "demo/signs-v3/co-gang.mp4",
    "cung":         "demo/signs-v3/cung-together.mp4",
    "cam on":       "demo/signs-v3/cam-on.mp4",
    "cam on ban":   "demo/signs-v3/cam-on.mp4",
    "thanh cong":   "demo/signs-v3/gioi.mp4",
    "dung im":      "demo/signs-v3/dung-im.mp4",
    "bat":          "demo/signs-v3/bat.mp4",
    "cham chi":     "demo/signs-v3/cham-chi.mp4",
    "con cho":      "demo/signs-v3/con-cho.mp4",
    "cho":          "demo/signs-v3/con-cho.mp4",
    "con chuot":    "demo/signs-v3/con-chuot.mp4",
    "chuot":        "demo/signs-v3/con-chuot.mp4",
    "con ga":       "demo/signs-v3/con-ga.mp4",
    "ga":           "demo/signs-v3/con-ga.mp4",
    "con meo":      "demo/signs-v3/con-meo.mp4",
    "meo":          "demo/signs-v3/con-meo.mp4",
    "gay":          "demo/signs-v3/gay.mp4",
    "nha":          "demo/signs-v3/nha.mp4",
    "rat vui duoc gap": "demo/signs-v3/rat-vui-duoc-gap.mp4",
    "that tuyet":   "demo/signs-v3/rat-vui-duoc-gap.mp4",
    "rinh mo":      "demo/signs-v3/rinh-mo.mp4",
    "trong coi":    "demo/signs-v3/trong-coi.mp4",
    "tu hao":       "demo/signs-v3/tu-hao.mp4",
    // Converted from .mov → .mp4 trong dev branch
    // "xin chao" vẫn là .mov trên máy — chưa có .mp4, fallback sang backend
    // "xin chao":     "demo/signs-v3/xin-chao.mp4",
    // "chao":         "demo/signs-v3/xin-chao.mp4",
    "di hoc":       "demo/signs-v3/di-hoc.mp4",
    "ve nha":       "demo/signs-v3/ve-nha.mp4",
    "di ve":        "demo/signs-v3/ve-nha.mp4",
    "bo me":        "demo/signs-v3/bo-me.mp4",
    "thay co":      "demo/signs-v3/thay-co.mp4",
    "danh hieu":    "demo/signs-v3/danh-hieu.mp4",
    "giai":         "demo/signs-v3/danh-hieu.mp4",
    "co vua":       "demo/signs-v3/co-vua.mp4",
    "dong vien":    "demo/signs-v3/dong-vien.mp4",
    // "buon":      không có file nào trong bundle, fallback sang backend
    "nhieu":        "demo/signs-v3/nhieu.mp4",
    "trach mang":   "demo/signs-v3/trach-mang.mp4",
    "tu trach":     "demo/signs-v3/trach-mang.mp4",
    // "ban than":  ban-than-myself vẫn là .mov, fallback sang backend
    "chung toi":    "demo/signs-v3/chung-toi.mp4",
  };

  function mapWordToAnimation(word) {
    if (!word) return null;
    const cleanWord = word.trim().replace(/^[.,?!\-"]+|[.,?!\-"]+$/g, "");
    if (!cleanWord || !isMeaningfulWord(cleanWord)) return null;

    // Nếu là URL đầy đủ (Cloudinary/HTTPS) thì pass-through trực tiếp.
    if (cleanWord.startsWith('https://') || cleanWord.startsWith('http://')) {
      if (!cleanWord.includes('localhost') && !cleanWord.includes('127.0.0.1')) {
        return cleanWord;
      }
    }

    // Ưu tiên tra bảng local (file bundle trong extension) — không có network delay.
    const normKey = stripVietnameseAccents(cleanWord.toLowerCase()).replace(/[-_]/g, " ").trim();
    if (chrome.runtime && chrome.runtime.getURL && LOCAL_DEMO_SIGNS[normKey]) {
      return chrome.runtime.getURL(LOCAL_DEMO_SIGNS[normKey]);
    }

    // Fallback: build URL từ backend assets (Cloudinary hoặc server).
    const fileKey = stripVietnameseAccents(cleanWord.toLowerCase()).replace(/\s+/g, "-");
    return `${BACKEND_URL}/assets/animations/${fileKey}.mp4`;
  }

  function processSubtitleLocally(subtitle) {
    if (!subtitle) return [];

    const words = splitTextIntoWords(subtitle);
    const signDataList = [];

    for (const word of words) {
      const animationUrl = mapWordToAnimation(word);
      if (animationUrl) {
        signDataList.push({
          word: word,
          animation: animationUrl
        });
      }
    }

    return signDataList;
  }

  // ═══════════════════════════════════════════════════════════════════
  // FULL SIGN SEQUENCE: Append & Send to Backend
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Thêm signDataList mới vào mảng fullSignSequence toàn cục,
   * sau đó gửi toàn bộ mảng lên BE để lưu trữ.
   *
   * @param {Array<{word: string, animation: string}>} signDataList
   *   - Danh sách ký hiệu từ 1 lần dịch (output của backend AI).
   */
  function appendToFullSignSequence(signDataList) {
    if (!signDataList || signDataList.length === 0) return;

    const now = Date.now();
    // Gắn timestamp (ms từ epoch) vào mỗi ký hiệu để BE biết thứ tự thời gian
    const itemsWithTimestamp = signDataList.map(item => ({
      word: item.word,
      animation: item.animation || null,
      appendedAt: now
    }));

    fullSignSequence.push(...itemsWithTimestamp);

    // In toàn bộ mảng ký hiệu hiện tại ra console
    console.group(`📚 [Signify] fullSignSequence — ${fullSignSequence.length} ký hiệu tổng cộng`);
    console.log('Vừa thêm:', itemsWithTimestamp.map(i => i.word));
    console.log('Toàn bộ mảng hiện tại (word):',
      fullSignSequence.map(i => i.word)
    );
    console.log('Chi tiết đầy đủ:');
    console.table(fullSignSequence.map((i, idx) => ({
      STT: idx + 1,
      word: i.word,
      animation: i.animation ? '✅ có' : '❌ không có',
      appendedAt: new Date(i.appendedAt).toLocaleTimeString('vi-VN')
    })));
    console.groupEnd();

    // KHÔNG gửi BE sau mỗi lần append.
    // Chỉ gửi 1 lần duy nhất khi kết thúc video (xem sendFullSignSequenceToBackend trong handlePageTransition).
  }

  /**
   * Lấy toàn bộ `word` trong fullSignSequence, ghép thành 1 chuỗi ký hiệu ngăn cách bởi dấu phẩy,
   * và gửi duy nhất trường `signLanguageText` lên BE.
   *
   * BE API: POST /api/ai/sign-sequence
   * Body: {
   *   signLanguageText: "thi, môn cua, cấp trường, ra, động viên, bạn ấy, buồn, hôm nay, ..."
   * }
   */
  function sendFullSignSequenceToBackend() {
    if (!fullSignSequence || fullSignSequence.length === 0) return;
    if (!chrome.runtime || !chrome.runtime.id) return;

    // Ghép tất cả các từ ký hiệu ngăn cách bằng dấu phẩy và khoảng trắng ", "
    const signLanguageText = fullSignSequence.map(i => i.word).join(', ');

    const payload = {
      signLanguageText: signLanguageText
    };

    console.log('📤 [Signify] Payload duy nhất signLanguageText sắp gửi lên BE:');
    console.log('  signLanguageText:', payload.signLanguageText);

    chrome.runtime.sendMessage({
      action: "send_full_sign_sequence",
      data: payload
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[Signify] sendFullSignSequenceToBackend error:", chrome.runtime.lastError.message);
        return;
      }
      if (response && response.success) {
        console.log(`✅ [Signify] signLanguageText đã gửi BE thành công.`);
      } else {
        console.warn("[Signify] Gửi signLanguageText lên BE thất bại:", response);
      }
    });
  }

  function renderSignCaptionText(signDataList, fallbackText) {
    const captionText = document.getElementById('signify-caption-text');
    if (!captionText) return;

    // Không gộp chữ nữa, chữ sẽ được cập nhật động theo từng video trong playNextAnimation
    if (!signDataList || signDataList.length === 0) {
      captionText.textContent = "Chờ phụ đề...";
    }
  }

  // Video "đứng yên" phát khi rảnh hoặc khi một từ không có clip riêng.
  const IDLE_VIDEO_URL = "https://res.cloudinary.com/rlj4wvvu/video/upload/dung-im.mp4";
  const FREE_DAILY_LIMIT_MESSAGE = "Bạn đã dùng hết 20 phút miễn phí hôm nay. Đăng ký gói để tiếp tục xem phụ đề ký hiệu.";

  let overlayContainer = null;
  let overlayVisible = true;
  let animationQueue = [];
  let isPlaying = false;
  let observer = null;
  let lastSubtitleText = "";
  let lastSentSubtitle = "";
  let pendingCaption = "";
  let subtitleDebounceTimeout = null;
  let animationTimeout = null;
  let currentSignifyUser = null;
  let usageSessionId = null;
  let usageHeartbeatTimer = null;
  let quotaBlocked = false;

  // ═══════════════════════════════════════════════════════════════════
  // DEMO TIMELINES MAPPING TABLE & DUAL-BUFFER PLAYER STATE
  // Ánh xạ 3 video demo -> file timeline local tương ứng
  // ═══════════════════════════════════════════════════════════════════
  const DEMO_TIMELINE_MAP = {
    "SflJFE11Y6M": "demo/timeline-v1.json", // Demo 1 (Tiếng Việt)
    "demo1": "demo/timeline-v1.json",
    "demo2": "demo/timeline-eng.json",      // Demo 2 (Tiếng Anh)
    "demo3": "demo/timeline-v3.json"       // Demo 3 (VSL final timeline)
  };

  let activePlayerIndex = 0; // 0 hoặc 1 (đệm 2 video player để chuyển mượt không đen màn)

  function getActiveVideoPlayer() {
    return document.getElementById(`signify-video-player-${activePlayerIndex}`) ||
           document.getElementById('signify-video-player-0') ||
           document.getElementById('signify-video-player');
  }

  function getStandbyVideoPlayer() {
    return document.getElementById(`signify-video-player-${1 - activePlayerIndex}`) ||
           document.getElementById('signify-video-player-1');
  }

  function handleVideoEnded() {
    clearTimeout(animationTimeout);
    playIdleVideo();
  }

  function bindVideoPlayerEvents(player) {
    if (!player) return;
    player.removeEventListener('ended', handleVideoEnded);
    player.addEventListener('ended', handleVideoEnded);
    player.removeEventListener('error', handleVideoError);
    player.addEventListener('error', handleVideoError);
  }

  function handleVideoError(e) {
    const badSrc = e.target ? (e.target.currentSrc || e.target.src || '') : '';
    if (badSrc && !badSrc.includes('dung-im')) {
      console.warn('[Signify] Video không tải được, chuyển sang trạng thái idle:', badSrc);
    }
    playIdleVideo();
  }

  function getDemoTimelinePath(videoId) {
    if (!videoId) return null;
    if (DEMO_TIMELINE_MAP[videoId]) return DEMO_TIMELINE_MAP[videoId];

    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get('demo') || urlParams.get('vsl_demo');
    if (demoParam === '1' || demoParam === 'v1') return "demo/timeline-v1.json";
    if (demoParam === '2' || demoParam === 'eng') return "demo/timeline-eng.json";
    if (demoParam === '3' || demoParam === 'v3') return "demo/timeline-v3.json";

    return null;
  }

  async function loadDemoTimeline(timelinePath) {
    if (!chrome.runtime || !chrome.runtime.getURL) return false;
    const fullUrl = chrome.runtime.getURL(timelinePath);
    console.log(`🎬 [Signify] Khởi chạy demo timeline local: ${timelinePath}`);

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      fullTranscript = data.map(item => {
        const startMs = (item.start || 0) * 1000;
        const endMs = item.end ? (item.end * 1000) : (startMs + 5000);

        const translatedSignData = (item.clips || []).map(clipPath => {
          const fileName = clipPath.split('/').pop();
          const cleanName = fileName.replace(/\.(mp4|mov|jpg|png)$/i, '');
          const word = cleanName.replace(/[-_]/g, ' ');
          return {
            word: word,
            animation: mapWordToAnimation(word) || chrome.runtime.getURL(clipPath)
          };
        });

        return {
          start: startMs,
          end: endMs,
          text: item.text || "",
          translatedSignData: translatedSignData,
          isFetching: false
        };
      });

      console.log(`✅ [Signify] Nạp thành công ${fullTranscript.length} phân đoạn demo timeline!`);
      const captionText = document.getElementById('signify-caption-text');
      if (captionText) captionText.textContent = "Signify đã đồng bộ dòng thời gian demo!";
      startTimelineSync();
      return true;
    } catch (e) {
      console.error(`❌ [Signify] Lỗi khi nạp demo timeline ${timelinePath}:`, e);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // REMOTE URL VALIDATION CACHE
  // HEAD request có cache để tránh ERR_FILE_NOT_FOUND lặp lại.
  // Cloudinary URL không tồn tại (404) → dùng IDLE thay vì load vào <video>.
  // ═══════════════════════════════════════════════════════════════════
  const urlExistenceCache = new Map();

  function resolveVideoUrl(url) {
    if (!url) return Promise.resolve(IDLE_VIDEO_URL);
    if (url.startsWith('chrome-extension:') || url.startsWith('data:')) {
      return Promise.resolve(url); // local bundle, luôn tin tưởng
    }
    if (url.startsWith('https://')) {
      const cached = urlExistenceCache.get(url);
      if (cached === true)  return Promise.resolve(url);
      if (cached === false) return Promise.resolve(IDLE_VIDEO_URL);
      return fetch(url, { method: 'HEAD', mode: 'cors' })
        .then(res => {
          const exists = res.status !== 404 && res.status !== 410;
          urlExistenceCache.set(url, exists);
          return exists ? url : IDLE_VIDEO_URL;
        })
        .catch(() => {
          // CORS hoặc network error → thử load thật, nếu lỗi video.onerror xử lý
          urlExistenceCache.set(url, true);
          return url;
        });
    }
    // URL không hợp lệ (relative path, v.v.) → idle
    return Promise.resolve(IDLE_VIDEO_URL);
  }

  // ═══════════════════════════════════════════════════════════════════
  // TRANSLATION ENABLE GATE
  // Chỉ bắt đầu dịch khi user bấm nút. Mặc định TẮT.
  // ═══════════════════════════════════════════════════════════════════
  let translationEnabled = false;

  // ═══════════════════════════════════════════════════════════════════
  // FULL SIGN SEQUENCE ACCUMULATOR
  // Mảng tổng hợp TOÀN BỘ ký hiệu ngôn ngữ đã dịch trong phiên xem video.
  // Mỗi lần backend trả về signDataList → append vào đây → gửi BE lưu lại.
  // Format: Array<{ word: string, animation: string, timestamp: number }>
  // ═══════════════════════════════════════════════════════════════════
  let fullSignSequence = [];

  // Timeline Synchronization Engine State
  let activeVideoId = "";
  let fullTranscript = []; // Array of { start: ms, end: ms, text: String, translatedSignData: Array, isFetching: Boolean }
  let lastActiveSegment = null;
  let isSyncActive = false;

  // Helper to extract the YouTube video ID from URL
  function getYouTubeVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  function openSignifyLogin() {
    window.open(`${FRONTEND_URL}/#/login`, '_blank', 'noopener,noreferrer');
  }

  function openSignifyProfile() {
    window.open(`${FRONTEND_URL}/#/profile`, '_blank', 'noopener,noreferrer');
  }

  function renderSignifyUserInfo() {
    if (!chrome.storage || !chrome.storage.local) return;

    chrome.storage.local.get(['signifyUser'], (data) => {
      const userAvatarEl = document.getElementById('signify-user-avatar');
      const loginBtn = document.getElementById('signify-login-btn');

      if (data.signifyUser) {
        try {
          const user = JSON.parse(data.signifyUser);
          currentSignifyUser = user;
          const displayName = user.fullName || user.email || 'Signify User';
          const avatarUrl = user.avatarUrl || user.avatar || '';

          if (loginBtn) loginBtn.style.display = 'none';
          if (userAvatarEl) {
            userAvatarEl.style.display = 'flex';
            userAvatarEl.textContent = avatarUrl ? '' : (displayName.charAt(0) || 'S').toUpperCase();
            userAvatarEl.style.backgroundImage = avatarUrl ? `url(${avatarUrl})` : '';
            userAvatarEl.style.backgroundSize = 'cover';
            userAvatarEl.style.backgroundPosition = 'center';
            userAvatarEl.title = `${displayName} - Xem hồ sơ (Profile)`;
          }
        } catch (e) {
          currentSignifyUser = null;
          if (userAvatarEl) userAvatarEl.style.display = 'none';
          if (loginBtn) loginBtn.style.display = 'inline-flex';
        }
      } else {
        currentSignifyUser = null;
        if (userAvatarEl) userAvatarEl.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-flex';
      }
    });
  }

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.signifyUser) {
        console.log("🔄 Signify user data changed, updating UI...");
        renderSignifyUserInfo();

        // Nếu vừa đăng nhập (từ null -> có data), restart usage session
        if (changes.signifyUser.newValue && !changes.signifyUser.oldValue) {
          console.log("✅ User just logged in, restarting session...");

          // Clear quota block nếu đang bị block
          if (quotaBlocked) {
            quotaBlocked = false;
            const videoPlayer = document.getElementById('signify-video-player');
            const fallbackCard = document.getElementById('signify-fallback-card');
            if (videoPlayer) {
              videoPlayer.style.display = 'block';
            }
            if (fallbackCard) {
              fallbackCard.style.display = 'none';
            }
          }

          // Restart usage session
          if (overlayVisible && getYouTubeVideoId()) {
            startUsageSession();
          }

          // Restart timeline sync nếu cần
          if (!isSyncActive && fullTranscript.length > 0) {
            startTimelineSync();
          } else if (!isSyncActive) {
            // Trigger a page transition to reload transcript
            handlePageTransition();
          }
        }
      }

      // Lắng nghe thay đổi authToken
      if (areaName === 'local' && changes.signifyAuthToken) {
        console.log("🔄 Auth token changed, updating state...");

        if (changes.signifyAuthToken.newValue && !changes.signifyAuthToken.oldValue) {
          console.log("✅ Auth token added, user logged in");

          // Clear quota block
          if (quotaBlocked) {
            quotaBlocked = false;
            const videoPlayer = document.getElementById('signify-video-player');
            const fallbackCard = document.getElementById('signify-fallback-card');
            if (videoPlayer) {
              videoPlayer.style.display = 'block';
            }
            if (fallbackCard) {
              fallbackCard.style.display = 'none';
            }

            // Close any modal
            const modal = document.getElementById('signify-limit-modal');
            if (modal) {
              modal.style.display = 'none';
            }
          }

          // Restart everything
          if (overlayVisible && getYouTubeVideoId()) {
            setTimeout(() => {
              handlePageTransition();
            }, 500);
          }
        }
      }
    });
  }

  function showSignifyLimitModal(message, authRequired = false) {
    let modal = document.getElementById('signify-limit-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'signify-limit-modal';
      modal.className = 'signify-limit-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="signify-limit-card">
        <div class="signify-limit-icon"><img class="signify-limit-logo" src="${LOGO_URL}" alt="Signify" /></div>
        <div class="signify-limit-title">${authRequired ? 'Cần đăng nhập Signify' : 'Đã hết 20 phút hôm nay'}</div>
        <div class="signify-limit-message">${message}</div>
        <div class="signify-limit-actions">
          ${authRequired ? '<button class="signify-limit-primary" id="signify-modal-login-btn">Đăng nhập</button>' : '<button class="signify-limit-primary" id="signify-modal-upgrade-btn">Đăng ký gói</button>'}
          <button class="signify-limit-secondary" id="signify-modal-close-btn">Đóng</button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    const loginBtn = document.getElementById('signify-modal-login-btn');
    const upgradeBtn = document.getElementById('signify-modal-upgrade-btn');
    const closeBtn = document.getElementById('signify-modal-close-btn');
    if (loginBtn) loginBtn.addEventListener('click', openSignifyLogin);
    if (upgradeBtn) upgradeBtn.addEventListener('click', () => window.open(`${FRONTEND_URL}/#/packages`, '_blank', 'noopener,noreferrer'));
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  }

  function showFreeDailyLimitState(message = FREE_DAILY_LIMIT_MESSAGE) {
    quotaBlocked = true;
    animationQueue = [];
    clearTimeout(animationTimeout);

    const ytVideo = document.querySelector('video.html5-main-video');
    if (ytVideo) ytVideo.removeEventListener('timeupdate', handleTimelineUpdate);
    isSyncActive = false;
    lastActiveSegment = null;

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    const videoPlayer = document.getElementById('signify-video-player');
    if (videoPlayer) {
      videoPlayer.pause();
      videoPlayer.removeAttribute('src');
      videoPlayer.removeAttribute('data-idle');
      videoPlayer.load();
      videoPlayer.style.display = 'none';
    }

    const fallbackCard = document.getElementById('signify-fallback-card');
    if (fallbackCard) {
      fallbackCard.style.display = 'flex';
      fallbackCard.innerHTML = `
        <div class="signify-limit-inline-icon">⏱️</div>
        <div class="signify-limit-inline-title">Đã dùng hết 20 phút hôm nay</div>
        <div class="signify-limit-inline-message">Đăng ký gói để tiếp tục xem phụ đề ký hiệu.</div>
        <button class="signify-limit-inline-button" id="signify-inline-upgrade-btn" type="button">Đăng ký gói</button>
      `;

      const inlineUpgradeBtn = document.getElementById('signify-inline-upgrade-btn');
      if (inlineUpgradeBtn) {
        inlineUpgradeBtn.addEventListener('click', () => window.open(`${FRONTEND_URL}/packages`, '_blank', 'noopener,noreferrer'));
      }
    }

    const captionText = document.getElementById('signify-caption-text');
    if (captionText) captionText.textContent = message;

    setHideNativeCaptions(false);
    showSignifyLimitModal(message);
  }

  function stopUsageSession() {
    if (usageHeartbeatTimer) {
      clearInterval(usageHeartbeatTimer);
      usageHeartbeatTimer = null;
    }

    if (usageSessionId && chrome.runtime && chrome.runtime.id) {
      chrome.runtime.sendMessage({
        action: 'usage_session_end',
        sessionId: usageSessionId
      }, () => { });
    }

    usageSessionId = null;
  }

  function handleQuotaOrAuthResponse(response) {
    if (!response) return false;
    if (response.quotaExceeded) {
      stopUsageSession();
      showFreeDailyLimitState(response.data?.message || FREE_DAILY_LIMIT_MESSAGE);
      return true;
    }
    if (response.authRequired) {
      stopUsageSession();
      showSignifyLimitModal(response.error || 'Vui lòng đăng nhập Signify để sử dụng extension.', true);
      return true;
    }
    return false;
  }

  function sendUsageHeartbeat() {
    if (!usageSessionId || quotaBlocked || !chrome.runtime || !chrome.runtime.id) return;

    const ytVideo = document.querySelector('video.html5-main-video');
    if (!overlayVisible || !ytVideo || ytVideo.paused || ytVideo.ended) return;

    chrome.runtime.sendMessage({
      action: 'usage_session_heartbeat',
      sessionId: usageSessionId
    }, (response) => {
      if (response?.success) {
        console.log('Signify usage heartbeat recorded:', response.data);
      }
      handleQuotaOrAuthResponse(response);
    });
  }

  function startUsageSession() {
    if (usageSessionId || quotaBlocked || !chrome.runtime || !chrome.runtime.id) return;

    chrome.runtime.sendMessage({
      action: 'usage_session_start',
      requestData: {
        source: 'EXTENSION',
        videoId: getYouTubeVideoId() || ''
      }
    }, (response) => {
      if (!response) return;

      if (response.success && response.data?.sessionId) {
        usageSessionId = response.data.sessionId;
        console.log('Signify usage session started:', usageSessionId);
        if (usageHeartbeatTimer) clearInterval(usageHeartbeatTimer);
        usageHeartbeatTimer = setInterval(sendUsageHeartbeat, 30000);
        setTimeout(sendUsageHeartbeat, 30000);
        return;
      }

      handleQuotaOrAuthResponse(response);
    });
  }

  window.addEventListener('beforeunload', stopUsageSession);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopUsageSession();
    else if (overlayVisible && getYouTubeVideoId()) startUsageSession();
  });

  // 1. Create Picture-in-Picture visual overlay on YouTube Watch Page
  function createOverlay() {
    if (document.getElementById('signify-overlay')) {
      console.log("Overlay already exists");
      return;
    }

    console.log("Creating overlay...");
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'signify-overlay';
    overlayContainer.className = 'signify-overlay-container';

    // Modern glowing collapsed logo button and overlay panel
    overlayContainer.innerHTML = `
      <button class="signify-collapsed-logo-btn" id="signify-collapsed-logo-btn">
        <img class="signify-collapsed-logo" src="${LOGO_URL}" alt="Signify Logo" />
      </button>
      <div class="signify-panel-content">
        <div class="signify-overlay-header">
          <div class="signify-brand-wrapper">
            <img class="signify-header-logo" src="${LOGO_URL}" alt="Signify" />
            <span class="signify-logo-text">VSL - KÝ HIỆU VIỆT NAM</span>
          </div>
          <div class="signify-header-actions">
            <div class="signify-header-avatar" id="signify-user-avatar">?</div>
            <button class="signify-login-btn" id="signify-login-btn" type="button">Đăng nhập</button>
            <button class="signify-theme-btn" id="signify-theme-btn">🌙</button>
            <button class="signify-close-btn" id="signify-close-btn">›</button>
          </div>
        </div>
        <div class="signify-video-container">
          <video id="signify-video-player-0" class="signify-video signify-video-active" muted autoplay playsinline></video>
          <video id="signify-video-player-1" class="signify-video signify-video-standby" muted playsinline style="opacity:0; display:none;"></video>
          <div id="signify-fallback-card" class="signify-fallback-card">
            <span class="signify-fallback-label">DỊCH KÝ HIỆU</span>
            <span id="signify-fallback-word" class="signify-fallback-word">Chờ dịch...</span>
          </div>
        </div>
        <div class="signify-translate-bar">
          <button id="signify-translate-toggle-btn" class="signify-translate-btn signify-translate-btn--off" type="button">
            <span class="signify-translate-btn-icon">▶</span>
            <span class="signify-translate-btn-label">Bắt đầu Dịch</span>
          </button>
          <div id="signify-caption-text" class="signify-caption-text" style="display:none;"></div>
        </div>
      </div>
      <!-- 4 Corner Resize Handles -->
      <div class="signify-resize-handle top-left" data-corner="tl"></div>
      <div class="signify-resize-handle top-right" data-corner="tr"></div>
      <div class="signify-resize-handle bottom-left" data-corner="bl"></div>
      <div class="signify-resize-handle bottom-right" data-corner="br"></div>
    `;

    // Append to YouTube Player container or body
    const ytPlayer = document.body;
    console.log("Appending overlay to:", ytPlayer);
    ytPlayer.appendChild(overlayContainer);
    console.log("Overlay created successfully");

    // Bind Translate Toggle Button
    const translateToggleBtn = document.getElementById('signify-translate-toggle-btn');
    if (translateToggleBtn) {
      translateToggleBtn.addEventListener('click', () => {
        translationEnabled = !translationEnabled;
        const btnIcon = translateToggleBtn.querySelector('.signify-translate-btn-icon');
        const btnLabel = translateToggleBtn.querySelector('.signify-translate-btn-label');
        const captionText = document.getElementById('signify-caption-text');

        if (translationEnabled) {
          translateToggleBtn.classList.remove('signify-translate-btn--off');
          translateToggleBtn.classList.add('signify-translate-btn--on');
          if (btnIcon) btnIcon.textContent = '⏹';
          if (btnLabel) btnLabel.textContent = 'Dừng Dịch';
          if (captionText) captionText.textContent = 'Đang khởi động dịch...';
          console.log('🟢 [Signify] Người dùng bật dịch');
          handlePageTransition();
        } else {
          translateToggleBtn.classList.remove('signify-translate-btn--on');
          translateToggleBtn.classList.add('signify-translate-btn--off');
          if (btnIcon) btnIcon.textContent = '▶';
          if (btnLabel) btnLabel.textContent = 'Bắt đầu Dịch';
          if (captionText) captionText.textContent = 'Nhấn để bắt đầu dịch';
          console.log('🔴 [Signify] Người dùng tắt dịch');
          // Dừng các pipeline đang chạy
          isSyncActive = false;
          lastActiveSegment = null;
          if (observer) { observer.disconnect(); observer = null; }
          clearTimeout(subtitleDebounceTimeout);
          setHideNativeCaptions(false);
          activeVideoId = ''; // Reset để lần bật tiếp theo sẽ load lại
          playIdleVideo();
        }
      });
    }

    // Restore saved panel dimensions, position, and theme if present
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['signifyPanelWidth', 'signifyPanelHeight', 'signifyPanelLeft', 'signifyPanelTop', 'signifyTheme'], (data) => {
        if (data.signifyPanelWidth) overlayContainer.style.width = data.signifyPanelWidth;
        if (data.signifyPanelHeight) overlayContainer.style.height = data.signifyPanelHeight;
        if (data.signifyPanelLeft !== undefined && data.signifyPanelTop !== undefined) {
          overlayContainer.style.left = data.signifyPanelLeft;
          overlayContainer.style.top = data.signifyPanelTop;
          overlayContainer.style.right = 'auto';
        }
        if (data.signifyTheme === 'light') {
          overlayContainer.classList.add('signify-light-theme');
          const themeBtn = document.getElementById('signify-theme-btn');
          if (themeBtn) {
            themeBtn.textContent = '☀️';
          }
        }
      });
    }

    // Load user info
    renderSignifyUserInfo();

    const userAvatar = document.getElementById('signify-user-avatar');
    if (userAvatar) {
      userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        openSignifyProfile();
      });
    }

    const loginBtn = document.getElementById('signify-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openSignifyLogin();
      });
    }

    // Handle expand back to full panel demo from collapsed logo button
    const expandPanelDemo = () => {
      overlayContainer.classList.remove('signify-collapsed');
      startUsageSession();
      setHideNativeCaptions(true);

      const videoPlayer = document.getElementById('signify-video-player');
      if (videoPlayer && videoPlayer.paused) {
        videoPlayer.play().catch(() => {});
      }
      handleTimelineUpdate();
    };

    const collapsedLogoBtn = document.getElementById('signify-collapsed-logo-btn');
    if (collapsedLogoBtn) {
      let isDraggingLogo = false;
      let logoStartX = 0;
      let logoStartY = 0;
      let logoStartLeft = 0;
      let logoStartTop = 0;
      let logoHasMoved = false;

      collapsedLogoBtn.addEventListener('pointerdown', (e) => {
        isDraggingLogo = true;
        logoHasMoved = false;
        logoStartX = e.clientX;
        logoStartY = e.clientY;

        const rect = overlayContainer.getBoundingClientRect();
        logoStartLeft = rect.left;
        logoStartTop = rect.top;

        const onPointerMove = (e) => {
          if (!isDraggingLogo) return;
          const deltaX = e.clientX - logoStartX;
          const deltaY = e.clientY - logoStartY;

          if (Math.hypot(deltaX, deltaY) > 6) {
            logoHasMoved = true;
          }

          if (logoHasMoved) {
            const panelWidth = overlayContainer.offsetWidth;
            const panelHeight = overlayContainer.offsetHeight;

            let newLeft = logoStartLeft + deltaX;
            let newTop = logoStartTop + deltaY;

            newLeft = Math.max(0, Math.min(window.innerWidth - panelWidth, newLeft));
            newTop = Math.max(0, Math.min(window.innerHeight - panelHeight, newTop));

            overlayContainer.style.right = 'auto';
            overlayContainer.style.left = `${newLeft}px`;
            overlayContainer.style.top = `${newTop}px`;
          }
        };

        const onPointerUp = () => {
          if (!isDraggingLogo) return;
          isDraggingLogo = false;

          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);

          if (logoHasMoved) {
            if (chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({
                signifyPanelLeft: overlayContainer.style.left,
                signifyPanelTop: overlayContainer.style.top
              });
            }
          } else {
            expandPanelDemo();
          }
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        e.stopPropagation();
      });
    }

    // Bind Theme Toggle Button (Dark Mode / Light Mode)
    const themeBtn = document.getElementById('signify-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const isLight = overlayContainer.classList.toggle('signify-light-theme');
        themeBtn.textContent = isLight ? '☀️' : '🌙';

        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            signifyTheme: isLight ? 'light' : 'dark'
          });
        }
      });
    }

    // Drag panel to ANY position on screen by pulling the header
    const headerEl = overlayContainer.querySelector('.signify-overlay-header');
    if (headerEl) {
      let isDraggingPanel = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      headerEl.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.signify-header-actions') || e.target.closest('button')) return;

        isDraggingPanel = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = overlayContainer.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;

        overlayContainer.classList.add('signify-is-dragging');
        document.body.style.userSelect = 'none';

        const onPointerMove = (e) => {
          if (!isDraggingPanel) return;
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          const panelWidth = overlayContainer.offsetWidth;
          const panelHeight = overlayContainer.offsetHeight;

          let newLeft = startLeft + deltaX;
          let newTop = startTop + deltaY;

          newLeft = Math.max(0, Math.min(window.innerWidth - panelWidth, newLeft));
          newTop = Math.max(0, Math.min(window.innerHeight - panelHeight, newTop));

          overlayContainer.style.right = 'auto';
          overlayContainer.style.left = `${newLeft}px`;
          overlayContainer.style.top = `${newTop}px`;
        };

        const onPointerUp = () => {
          if (!isDraggingPanel) return;
          isDraggingPanel = false;
          overlayContainer.classList.remove('signify-is-dragging');
          document.body.style.userSelect = '';

          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);

          if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({
              signifyPanelLeft: overlayContainer.style.left,
              signifyPanelTop: overlayContainer.style.top
            });
          }
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        e.preventDefault();
      });
    }

    // Drag-to-resize Logic for 4 corner handles
    const resizeHandles = overlayContainer.querySelectorAll('.signify-resize-handle');
    resizeHandles.forEach((handle) => {
      let isResizing = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      let startLeft = 0;
      let startTop = 0;
      const corner = handle.dataset.corner;

      const onPointerDown = (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = overlayContainer.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;

        overlayContainer.classList.add('signify-is-resizing');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = (corner === 'tl' || corner === 'br') ? 'nwse-resize' : 'nesw-resize';

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        e.preventDefault();
        e.stopPropagation();
      };

      const onPointerMove = (e) => {
        if (!isResizing) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const aspectRatio = startWidth / startHeight;

        const minWidth = 220;
        const maxWidth = Math.min(window.innerWidth * 0.9, window.innerWidth - 32);
        const minHeight = 200;
        const maxHeight = window.innerHeight * 0.9;

        let scaleDelta = 0;
        if (corner === 'br') {
          scaleDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY * aspectRatio;
        } else if (corner === 'bl') {
          scaleDelta = Math.abs(deltaX) > Math.abs(deltaY) ? -deltaX : deltaY * aspectRatio;
        } else if (corner === 'tr') {
          scaleDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : -deltaY * aspectRatio;
        } else if (corner === 'tl') {
          scaleDelta = Math.abs(deltaX) > Math.abs(deltaY) ? -deltaX : -deltaY * aspectRatio;
        }

        let newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + scaleDelta));
        let newHeight = newWidth / aspectRatio;

        if (newHeight < minHeight) {
          newHeight = minHeight;
          newWidth = newHeight * aspectRatio;
        } else if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = newHeight * aspectRatio;
        }

        let newLeft = startLeft;
        let newTop = startTop;

        if (corner === 'tl' || corner === 'bl') {
          newLeft = startLeft + (startWidth - newWidth);
        }
        if (corner === 'tl' || corner === 'tr') {
          newTop = startTop + (startHeight - newHeight);
        }

        overlayContainer.style.width = `${Math.round(newWidth)}px`;
        overlayContainer.style.height = `${Math.round(newHeight)}px`;
        overlayContainer.style.right = 'auto';
        overlayContainer.style.left = `${Math.round(newLeft)}px`;
        overlayContainer.style.top = `${Math.round(newTop)}px`;
      };

      const onPointerUp = () => {
        if (!isResizing) return;
        isResizing = false;
        overlayContainer.classList.remove('signify-is-resizing');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            signifyPanelWidth: overlayContainer.style.width,
            signifyPanelHeight: overlayContainer.style.height,
            signifyPanelLeft: overlayContainer.style.left,
            signifyPanelTop: overlayContainer.style.top
          });
        }
      };

      handle.addEventListener('pointerdown', onPointerDown);
    });

    // Bind Close Event
    const closeBtn = document.getElementById('signify-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlayContainer.classList.add('signify-collapsed');
        overlayContainer.classList.remove('signify-expanded'); // Đảm bảo thu nhỏ lại khi đóng
        stopUsageSession();
        setHideNativeCaptions(false); // Thu gọn overlay: hiện lại CC gốc của YouTube
      });
    }

    // Bind dual video players safely
    const videoPlayer0 = document.getElementById('signify-video-player-0');
    const videoPlayer1 = document.getElementById('signify-video-player-1');
    bindVideoPlayerEvents(videoPlayer0);
    bindVideoPlayerEvents(videoPlayer1);

    // Ngay khi tạo overlay: phát video đứng yên làm trạng thái chờ nếu còn lượt miễn phí.
    if (quotaBlocked) {
      showFreeDailyLimitState();
    } else {
      playIdleVideo();
      startUsageSession();
    }
  }

  // Phát video "đứng yên" lặp lại (trạng thái chờ).
  function playIdleVideo() {
    if (quotaBlocked) return;
    const activePlayer = getActiveVideoPlayer();
    const standbyPlayer = getStandbyVideoPlayer();
    if (!activePlayer) return;
    isPlaying = false;

    // Khi phát video đứng yên (nghỉ), xóa chữ hiển thị
    const captionText = document.getElementById('signify-caption-text');
    if (captionText) {
      captionText.textContent = "";
    }

    activePlayer.style.display = 'block';
    activePlayer.style.opacity = '1';
    activePlayer.classList.add('signify-video-active');
    activePlayer.classList.remove('signify-video-standby');
    activePlayer.loop = true;

    if (standbyPlayer) {
      standbyPlayer.style.opacity = '0';
      standbyPlayer.classList.add('signify-video-standby');
      standbyPlayer.classList.remove('signify-video-active');
      try { standbyPlayer.pause(); } catch (e) {}
    }

    if (activePlayer.getAttribute('data-idle') !== '1') {
      activePlayer.src = IDLE_VIDEO_URL;
      activePlayer.setAttribute('data-idle', '1');
      activePlayer.load();
    }
    activePlayer.play().catch(() => { });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. STRICT SEQUENTIAL ANIMATION RUNNER (STT 1 -> N GUARANTEED)
  // ═══════════════════════════════════════════════════════════════════

  let isRunnerProcessing = false; // Mutex lock tránh chạy đè loop
  const INTER_WORD_DELAY_MS = 600; // Khoảng nghỉ 0.6s giữa từ trước và từ sau

  // 3. Play Segment-Specific Sign Language Sequences (Sequential Queueing)
  function playSegmentSignData(signDataList, options = {}) {
    if (quotaBlocked || !signDataList || signDataList.length === 0) return;

    const validSigns = signDataList.filter(item => item && (item.word || item.animation));
    if (validSigns.length === 0) return;

    if (options.replaceQueue) {
      animationQueue = [...validSigns];
    } else {
      // Đưa các từ mới vào hàng đợi theo đúng thứ tự STT (tuần tự từ 1 -> N)
      for (const sign of validSigns) {
        const lastInQueue = animationQueue[animationQueue.length - 1];
        if (!lastInQueue || lastInQueue.word !== sign.word || lastInQueue.animation !== sign.animation) {
          animationQueue.push(sign);
        }
      }

      // Khống chế hàng đợi tối đa 20 từ để tránh trễ dòng thời gian
      if (animationQueue.length > 20) {
        animationQueue = animationQueue.slice(animationQueue.length - 20);
      }
    }

    // Khởi chạy vòng lặp xử lý tuần tự nếu chưa chạy
    processAnimationQueueSequentially();
  }

  /**
   * Vòng lặp xử lý mảng từ TUẦN TỰ từ STT 1 đến hết (Async/Await Loop)
   * Từ trước phát xong 100% -> Chuyển sang video đứng yên đệm (dung-im.mp4) -> Từ sau mới chạy.
   * ĐẢM BẢO KHÔNG BAO GIỜ BỊ MÀN HÌNH ĐEN TRONG SUỐT QUÁ TRÌNH PHÁT!
   */
  async function processAnimationQueueSequentially() {
    if (isRunnerProcessing || quotaBlocked) return;
    isRunnerProcessing = true;
    isPlaying = true;

    try {
      while (animationQueue.length > 0) {
        if (!translationEnabled || quotaBlocked) break;

        const currentSign = animationQueue.shift();
        if (!currentSign) continue;

        // 1. Cập nhật thẻ chữ tương ứng với từ STT hiện tại
        const captionText = document.getElementById('signify-caption-text');
        if (captionText) {
          if (currentSign.animation && currentSign.animation.includes('dung-im')) {
            captionText.textContent = "";
          } else {
            captionText.textContent = currentSign.word;
          }
        }

        // 2. Chờ từ hiện tại phát XONG 100% (Promise chỉ resolve khi video ended)
        await playSingleSignAnimationPromise(currentSign);

        // 3. Ngay khi từ kết thúc: phát video đứng yên (dung-im.mp4) làm đệm chuyển tiếp!
        // Triệt tiêu hoàn toàn màn hình đen giữa các từ hoặc khi chờ từ tiếp theo từ timeline.
        if (translationEnabled) {
          playIdleVideo();
          if (animationQueue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, INTER_WORD_DELAY_MS));
          }
        }
      }
    } catch (e) {
      console.warn('[Signify] Lỗi vòng lặp phát ký hiệu:', e);
    } finally {
      isRunnerProcessing = false;
      isPlaying = false;

      // Hết hàng đợi -> duy trì video đứng yên trạng thái chờ (idle)
      if (animationQueue.length === 0 && translationEnabled && !quotaBlocked) {
        playIdleVideo();
      }
    }
  }

  /**
   * Đóng gói việc phát 1 clip ký hiệu thành Promise.
   * Promise CHỈ RESOLVE khi video phát XONG 100% (sự kiện ended).
   */
  function playSingleSignAnimationPromise(currentSign) {
    return new Promise((resolve) => {
      const hasVideo = currentSign.animation && (
        currentSign.animation.startsWith('chrome-extension:') ||
        currentSign.animation.startsWith('data:') ||
        currentSign.animation.startsWith('https://')
      );
      const srcUrl = hasVideo ? currentSign.animation : IDLE_VIDEO_URL;

      let isDone = false;
      const finish = () => {
        if (!isDone) {
          isDone = true;
          resolve();
        }
      };

      // Timeout an toàn tối đa 6 giây cho mỗi từ (tránh treo nếu video bị kẹt)
      const safetyTimer = setTimeout(() => {
        console.warn(`[Signify] Hết thời gian chờ an toàn cho từ: "${currentSign.word}"`);
        finish();
      }, 6000);

      const onClipEnded = () => {
        clearTimeout(safetyTimer);
        finish();
      };

      if (srcUrl.startsWith('chrome-extension:') || srcUrl.startsWith('data:')) {
        executeVideoPlayWithCallback(srcUrl, onClipEnded);
        return;
      }

      resolveVideoUrl(srcUrl).then(validatedSrc => {
        if (validatedSrc === IDLE_VIDEO_URL && srcUrl !== IDLE_VIDEO_URL) {
          const captionText = document.getElementById('signify-caption-text');
          if (captionText && captionText.textContent === currentSign.word) {
            captionText.textContent = '';
          }
          clearTimeout(safetyTimer);
          finish();
        } else {
          executeVideoPlayWithCallback(validatedSrc, onClipEnded);
        }
      }).catch(() => {
        clearTimeout(safetyTimer);
        finish();
      });
    });
  }

  function executeVideoPlayWithCallback(finalSrc, onEndedCallback) {
    const activePlayer = getActiveVideoPlayer();
    const standbyPlayer = getStandbyVideoPlayer();

    if (!activePlayer) {
      if (onEndedCallback) onEndedCallback();
      return;
    }

    const attachEndedOnce = (player) => {
      const handler = () => {
        player.removeEventListener('ended', handler);
        player.removeEventListener('error', errorHandler);
        if (onEndedCallback) onEndedCallback();
      };
      const errorHandler = () => {
        player.removeEventListener('ended', handler);
        player.removeEventListener('error', errorHandler);
        if (onEndedCallback) onEndedCallback();
      };
      player.addEventListener('ended', handler, { once: true });
      player.addEventListener('error', errorHandler, { once: true });
    };

    if (!standbyPlayer) {
      attachEndedOnce(activePlayer);
      activePlayer.style.display = 'block';
      activePlayer.loop = false;
      activePlayer.removeAttribute('data-idle');
      activePlayer.src = finalSrc;
      activePlayer.load();
      activePlayer.play().catch(() => {
        if (onEndedCallback) onEndedCallback();
      });
      return;
    }

    // Smooth Dual-buffered swap
    attachEndedOnce(standbyPlayer);
    standbyPlayer.style.display = 'block';
    standbyPlayer.removeAttribute('data-idle');
    standbyPlayer.loop = false;
    standbyPlayer.src = finalSrc;
    standbyPlayer.load();

    const doSwap = () => {
      standbyPlayer.style.opacity = '1';
      standbyPlayer.classList.add('signify-video-active');
      standbyPlayer.classList.remove('signify-video-standby');

      activePlayer.style.opacity = '0';
      activePlayer.classList.remove('signify-video-active');
      activePlayer.classList.add('signify-video-standby');

      setTimeout(() => {
        try { activePlayer.pause(); activePlayer.style.display = 'none'; } catch (e) {}
      }, 150);

      activePlayerIndex = 1 - activePlayerIndex;
    };

    standbyPlayer.play().then(() => {
      doSwap();
    }).catch(err => {
      if (err && err.name !== 'AbortError') {
        console.warn('[Signify] Dual-buffer play error, falling back:', err.message || err);
      }
      activePlayer.src = finalSrc;
      activePlayer.load();
      activePlayer.play().catch(() => {
        if (onEndedCallback) onEndedCallback();
      });
    });
  }

  // 4. Send Subtitle Segment to Local Backend for Translation (AI-Backend-First with Local Fallback)
  function fetchSegmentTranslation(segment) {
    const words = splitTextIntoWords(segment.text);
    if (!words || words.length === 0) {
      console.log("No meaningful words found for segment, skipping backend lookup.");
      fallbackToLocal(segment);
      return;
    }

    if (!words || words.length === 0) {
      console.log("No meaningful words in segment, skipping backend lookup.");
      segment.translatedSignData = [];
      return;
    }

    const requestData = {
      videoId: getYouTubeVideoId() || window.location.href,
      words: words,
      text: segment.text
    };

    if (!chrome.runtime || !chrome.runtime.id) {
      fallbackToLocal(segment);
      return;
    }

    chrome.runtime.sendMessage({
      action: "fetch_dictionary_lookup",
      requestData: requestData
    }, (response) => {
      if (response && response.success && response.data && response.data.length > 0) {
        // Resolve animation URL: ưu tiên local, fallback Cloudinary/backend
        segment.translatedSignData = response.data.map(item => ({
          ...item,
          animation: mapWordToAnimation(item.animation || item.word) || item.animation || null
        }));
        // Pre-warm URL cache cho segment này (on-demand)
        segment.translatedSignData.forEach(item => {
          if (item.animation && item.animation.startsWith('https://')) {
            resolveVideoUrl(item.animation);
          }
        });
        if (lastActiveSegment === segment) {
          renderSignCaptionText(segment.translatedSignData, segment.text);
          playSegmentSignData(segment.translatedSignData);
        }
      } else {
        if (handleQuotaOrAuthResponse(response)) return;
        console.warn("Backend translation failed or returned empty. Falling back to local processing.");
        fallbackToLocal(segment);
      }
    });
  }

  function fallbackToLocal(segment) {
    try {
      const localSignData = processSubtitleLocally(segment.text);
      segment.translatedSignData = localSignData;
      if (lastActiveSegment === segment) {
        renderSignCaptionText(segment.translatedSignData, segment.text);
        playSegmentSignData(segment.translatedSignData);
      }
    } catch (e) {
      console.error("Local processing fallback failed:", e);
    }
  }

  // 5. Timeline Synchronization Handler
  function handleTimelineUpdate(e) {
    const video = e.target;
    const currentTimeMs = video.currentTime * 1000;

    // Search the active transcript event
    const activeSegment = fullTranscript.find(seg => currentTimeMs >= seg.start && currentTimeMs <= seg.end);

    if (activeSegment) {
      if (lastActiveSegment !== activeSegment) {
        lastActiveSegment = activeSegment;
        console.log(`⏱️ [TIMELINE SYNC] Matched segment: "${activeSegment.text}" at ${video.currentTime.toFixed(2)}s`);

        const captionText = document.getElementById('signify-caption-text');
        if (captionText) captionText.textContent = activeSegment.text;

        if (activeSegment.translatedSignData) {
          renderSignCaptionText(activeSegment.translatedSignData, activeSegment.text);
          playSegmentSignData(activeSegment.translatedSignData);
        } else if (!activeSegment.isFetching) {
          activeSegment.isFetching = true;
          fetchSegmentTranslation(activeSegment);
        }
      }
    } else {
      // Clear overlay captions if player advances beyond last matched caption
      if (lastActiveSegment && (currentTimeMs < lastActiveSegment.start || currentTimeMs > lastActiveSegment.end + 1200)) {
        lastActiveSegment = null;
        const captionText = document.getElementById('signify-caption-text');
        if (captionText) captionText.textContent = "Chờ phụ đề...";
      }
    }
  }

  // Start checking the video timeline for synchronizing sign language
  function startTimelineSync() {
    const ytVideo = document.querySelector('video.html5-main-video');
    if (!ytVideo) return;

    ytVideo.removeEventListener('timeupdate', handleTimelineUpdate);
    ytVideo.addEventListener('timeupdate', handleTimelineUpdate);
    isSyncActive = true;
    console.log("🚀 Premium YouTube Caption-Timeline Sync activated!");
  }  // 6. Request YouTube Player response from page context (Main World)
  function requestPlayerResponseFromPage() {
    return new Promise((resolve) => {
      if (!chrome.runtime || !chrome.runtime.id) {
        resolve(null);
        return;
      }
      chrome.runtime.sendMessage({ action: "get_player_response" }, (response) => {
        if (response && response.success && response.data) {
          console.log("Successfully retrieved player response via background service worker scripting API!");
          resolve(response.data);
        } else {
          console.warn("Could not retrieve player response via background worker:", response?.error);
          resolve(null);
        }
      });
    });
  }
  function buildCaptionUrlCandidates(baseUrl, languageCode) {
    const candidates = [];
    if (!baseUrl) return candidates;

    const base = new URL(baseUrl);
    const preferredLang = (languageCode || '').toLowerCase();

    const addVariant = (overrides = {}) => {
      const url = new URL(base.toString());
      Object.entries(overrides).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, value);
        }
      });
      candidates.push(url.toString());
    };

    addVariant({ fmt: 'json3', lang: preferredLang || 'vi' });
    addVariant({ fmt: 'json3', lang: preferredLang || 'en' });
    addVariant({ fmt: 'json3', lang: preferredLang || 'vi', kind: 'asr' });
    addVariant({ fmt: 'srv3', lang: preferredLang || 'vi' });
    addVariant({ fmt: 'srv1', lang: preferredLang || 'vi' });
    addVariant({ fmt: 'srv2', lang: preferredLang || 'vi' });
    addVariant({ fmt: 'json3' });
    addVariant({ fmt: 'srv3' });
    addVariant({ fmt: 'srv1' });
    addVariant({ fmt: 'srv2' });
    addVariant({ lang: preferredLang || 'vi' });
    addVariant({});

    return [...new Set(candidates)];
  }

  async function fetchCaptionTextFromYouTube(baseUrl, languageCode) {
    const candidates = buildCaptionUrlCandidates(baseUrl, languageCode);
    const errors = [];

    for (const [index, url] of candidates.entries()) {
      try {
        console.log(`Trying caption endpoint ${index + 1}/${candidates.length}: ${url}`);
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Accept': 'text/plain,application/xml,application/json,*/*',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.youtube.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        if (text && text.trim().length > 0) {
          return { text, url };
        }

        errors.push(new Error('Empty response'));
      } catch (e) {
        errors.push(e);
      }
    }

    throw errors[errors.length - 1] || new Error('All caption fetch attempts failed');
  }

  function parseCaptionPayload(text) {
    if (!text || !text.trim()) return null;

    const trimmedText = text.trim();

    try {
      const parsed = JSON.parse(trimmedText);
      if (parsed && parsed.events) {
        return parsed.events
          .filter(ev => ev.segs && ev.segs.some(s => s.utf8 && s.utf8.trim().length > 0))
          .map(ev => {
            const start = ev.tStartMs;
            const duration = ev.dDurationMs || 0;
            const transcriptText = ev.segs.map(s => s.utf8).join(' ').replace(/\n/g, ' ').trim();
            return {
              start,
              duration,
              text: transcriptText
            };
          });
      }
    } catch (e) {
      // Fall through to XML parser
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(trimmedText, 'application/xml');
      const textNodes = Array.from(xmlDoc.getElementsByTagName('text'));

      if (textNodes.length > 0) {
        return textNodes.map(node => {
          const start = Number(node.getAttribute('start') ?? node.getAttribute('t')) || 0;
          const duration = Number(node.getAttribute('dur') ?? node.getAttribute('d')) || 0;
          const content = node.textContent || '';
          return {
            start,
            duration,
            text: content.replace(/<[^>]+>/g, '').trim()
          };
        }).filter(segment => segment.text && segment.text.length > 0);
      }
    } catch (e) {
      // Ignore and fall back to failure below
    }

    return null;
  }

  // 7. Core Subtitle loader & XML-JSON Parser
  async function loadVideoTranscript(playerResponse) {
    if (!playerResponse) {
      console.warn("YouTube Player Response is unavailable. Retrying...");
      // Retry với delay thay vì fallback ngay
      setTimeout(async () => {
        const retryResponse = await requestPlayerResponseFromPage();
        if (retryResponse) {
          loadVideoTranscript(retryResponse);
        } else {
          activateObserverFallback("Không tải được thông tin video sau khi retry.");
        }
      }, 2000);
      return;
    }

    try {
      const captions = playerResponse.captions;
      if (!captions || !captions.playerCaptionsTracklistRenderer) {
        console.warn("This video has no pre-rendered captions/transcripts in player response.");
        activateObserverFallback("Video không có sẵn phụ đề.");
        return;
      }

      const tracks = captions.playerCaptionsTracklistRenderer.captionTracks;
      if (!tracks || tracks.length === 0) {
        console.warn("No caption tracks listed.");
        activateObserverFallback("Video không có file phụ đề.");
        return;
      }

      // Prioritize Vietnamese transcripts, then English, then first available
      let selectedTrack = tracks.find(t => t.languageCode === 'vi' || t.languageCode.startsWith('vi'));
      if (!selectedTrack) {
        selectedTrack = tracks.find(t => t.languageCode === 'en' || t.languageCode.startsWith('en'));
      }
      if (!selectedTrack) {
        selectedTrack = tracks[0];
      }

      console.log(`Loading caption track: ${selectedTrack.name.simpleText || selectedTrack.languageCode} (Timeline-based - NO CC needed)`);
      console.log(`Caption base URL: ${selectedTrack.baseUrl}`);

      // Try multiple formats for caption URL
      const captionFormats = [
        '&fmt=json3',  // JSON3 format
        '&fmt=srv1',  // SRV1 format (XML)
        '&fmt=srv2',  // SRV2 format (XML)
        '&fmt=srv3',  // SRV3 format (JSON)
        ''            // Default format
      ];

      let text = null;
      let lastError = null;

      // Prefer fetching from YouTube's official timedtext endpoint directly from the page context.
      try {
        const directResult = await fetchCaptionTextFromYouTube(selectedTrack.baseUrl, selectedTrack.languageCode || 'vi');
        if (directResult && directResult.text && directResult.text.trim().length > 0) {
          text = directResult.text;
          console.log("Successfully fetched caption from official YouTube timedtext endpoint");
        }
      } catch (e) {
        console.warn("Official YouTube caption fetch failed:", e);
        lastError = e;
      }

      // Fallback: try the background worker if the direct fetch is blocked.
      if (!text) {
        console.log("Direct caption fetch failed, trying background fallback...");
        for (const format of captionFormats) {
          const captionUrl = selectedTrack.baseUrl + format;
          console.log(`Trying caption format: ${format || 'default'}`);

          try {
            const response = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage({
                action: "fetch_youtube_caption",
                url: captionUrl
              }, (res) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else if (res && res.success) {
                  resolve(res);
                } else {
                  reject(new Error(res?.error || "Unknown background fetch error"));
                }
              });
            });

            if (response && response.text && response.text.trim().length > 0) {
              text = response.text;
              console.log(`Successfully fetched caption with format: ${format || 'default'} (background)`);
              break;
            }
          } catch (e) {
            console.warn(`Background fetch failed with format ${format || 'default'}:`, e);
            lastError = e;
          }
        }
      }

      if (!text || text.trim().length === 0) {
        console.error("All caption formats failed");
        throw new Error(lastError || "Caption response is empty for all formats");
      }

      try {
        const parsedSegments = parseCaptionPayload(text);
        if (!parsedSegments || parsedSegments.length === 0) {
          console.warn("Caption data has no parseable events");
          throw new Error("Phụ đề rỗng.");
        }

        // De-active DOM observer as we have robust timeline transcript data
        if (observer) {
          observer.disconnect();
          observer = null;
        }

        // Format timedtext payload to timeline segments
        fullTranscript = parsedSegments.map(segment => ({
          start: segment.start,
          end: segment.start + (segment.duration || 0),
          text: segment.text,
          translatedSignData: null,
          isFetching: false
        }));

        console.log(`Successfully parsed ${fullTranscript.length} sync-timeline caption segments!`);

        const captionText = document.getElementById('signify-caption-text');
        if (captionText) captionText.textContent = "Đang dịch trước phụ đề...";

        // Pre-fetch bản dịch ký hiệu cho tất cả đoạn (AI-Backend-First)
        prefetchTranslations();

        startTimelineSync();
      } catch (e) {
        console.error("JSON parse error:", e);
        activateObserverFallback("Lỗi parse caption JSON.");
      }
    } catch (e) {
      console.error("Timeline caption retrieval failed:", e);
      activateObserverFallback("Lỗi đồng bộ dòng thời gian.");
    }
  }

  // Cào transcript qua backend (không cần bật CC) — nguồn phụ đề ƯU TIÊN.
  // Backend tự đọc trang YouTube, lấy caption track, parse thành [{start,end,text}] (ms).
  async function loadTranscriptFromBackend(videoId) {
    if (!chrome.runtime || !chrome.runtime.id) return false;

    const captionText = document.getElementById('signify-caption-text');
    if (captionText) captionText.textContent = "Đang cào phụ đề từ máy chủ Signify...";

    const segments = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: "fetch_youtube_transcript",
        videoId: videoId
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Transcript backend message error:", chrome.runtime.lastError.message);
          resolve(null);
          return;
        }
        if (response && response.success && Array.isArray(response.data)) {
          resolve(response.data);
        } else {
          console.warn("Backend transcript failed:", response && response.error);
          resolve(null);
        }
      });
    });

    if (!segments || segments.length === 0) {
      return false;
    }

    // De-activate DOM observer khi đã có transcript
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    fullTranscript = segments.map(seg => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
      translatedSignData: null,
      isFetching: false
    }));

    console.log(`✅ Loaded ${fullTranscript.length} transcript segments from backend (NO CC needed).`);
    prefetchTranslations();
    startTimelineSync();
    return true;
  }

  // Dùng chung: pre-fetch bản dịch ký hiệu cho toàn bộ fullTranscript.
  function prefetchTranslations() {
    if (!fullTranscript || fullTranscript.length === 0) return;

    const captionText = document.getElementById('signify-caption-text');
    if (captionText) captionText.textContent = "Đang đồng bộ phụ đề với AI...";

    let completedCount = 0;
    const total = fullTranscript.length;

    const markProgress = () => {
      completedCount++;
      if (captionText) {
        captionText.textContent = `Đang dịch phụ đề (${completedCount}/${total})...`;
        if (completedCount === total) {
          captionText.textContent = "Signify đã đồng bộ dòng thời gian!";
        }
      }
    };

    fullTranscript.forEach((seg) => {
      const words = splitTextIntoWords(seg.text);
      if (!words || words.length === 0) {
        seg.translatedSignData = [];
        markProgress();
        return;
      }

      const requestData = {
        videoId: getYouTubeVideoId() || window.location.href,
        words: words,
        text: seg.text
      };

      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          action: "fetch_dictionary_lookup",
          requestData: requestData
        }, (response) => {
          if (response && response.success && response.data && response.data.length > 0) {
            const receivedWords = response.data.map(item => item.word).join(', ');
            console.log(`🎯 Backend AI translation successful (API mode). Input: "${seg.text}" -> Output words: [${receivedWords}]`);
            // Resolve animation URL: ưu tiên local demo, fallback Cloudinary URL từ backend
            seg.translatedSignData = response.data.map(item => ({
              ...item,
              animation: mapWordToAnimation(item.animation || item.word) || item.animation || null
            }));
            // Pre-warm URL cache ngay lập tức (fire-and-forget):
            // khi timeline đến segment này, HEAD request đã xong → playNextAnimation không cần chờ
            seg.translatedSignData.forEach(item => {
              if (item.animation && item.animation.startsWith('https://')) {
                resolveVideoUrl(item.animation);
              }
            });
          } else {
            seg.translatedSignData = processSubtitleLocally(seg.text);
          }
          markProgress();
        });
      } else {
        seg.translatedSignData = processSubtitleLocally(seg.text);
        markProgress();
      }
    });
  }

  // Bật/tắt ẩn phụ đề gốc của YouTube (dùng class trên <html>, xem content.css).
  function setHideNativeCaptions(hide) {
    if (hide) {
      document.documentElement.classList.add('signify-hide-native-cc');
    } else {
      document.documentElement.classList.remove('signify-hide-native-cc');
    }
  }

  // Bật NGẦM track phụ đề của YouTube để player tự sinh pot-token và render chữ vào DOM,
  // đồng thời ẩn CC khỏi mắt người dùng bằng CSS. Đây là cách duy nhất còn hoạt động sau khi
  // YouTube chặn cào timedtext trực tiếp (mọi format trả rỗng nếu thiếu pot token).
  // Trả về true nếu đã kích hoạt được nút CC.
  async function enableCaptionsSilently() {
    // Ẩn trước để không lóe CC lên màn hình khi vừa bật.
    setHideNativeCaptions(true);

    const findCcButton = () =>
      document.querySelector('.ytp-subtitles-button') ||
      Array.from(document.querySelectorAll('button')).find(btn =>
        /subtitle|caption|phụ đề/i.test(btn.getAttribute('aria-label') || ''));

    // Player có thể chưa render nút CC; thử vài lần.
    let ccButton = null;
    for (let attempt = 0; attempt < 10 && !ccButton; attempt++) {
      ccButton = findCcButton();
      if (!ccButton) await new Promise(r => setTimeout(r, 500));
    }
    if (!ccButton) {
      console.warn("Không tìm thấy nút CC của YouTube để bật ngầm.");
      return false;
    }

    const isActive = ccButton.getAttribute('aria-pressed') === 'true' ||
      ccButton.classList.contains('ytp-subtitles-button-active');
    if (!isActive) {
      ccButton.click();
      console.log("Đã bật ngầm phụ đề YouTube (ẩn khỏi người dùng).");
      // Chờ player render caption window.
      await new Promise(r => setTimeout(r, 1500));
    }
    return true;
  }

  // Fallback cuối (con đường CHÍNH sau khi API bị chặn): bật ngầm CC + ẩn CSS + observer đọc DOM.
  async function activateObserverFallback(reason) {
    console.log(`ℹ️ Không cào được transcript qua API (${reason}). Chuyển sang đọc phụ đề đã render (ẩn).`);
    const captionText = document.getElementById('signify-caption-text');
    if (captionText) captionText.textContent = "Đang bật ngầm phụ đề để dịch...";

    try {
      await enableCaptionsSilently();
    } catch (e) {
      console.warn("enableCaptionsSilently lỗi:", e);
    }

    if (captionText) captionText.textContent = "Đang đọc & dịch phụ đề...";
    startSubtitleObserver();
  }

  // 8. Legacy MutationObserver Fallback loop (AI-Backend-First Approach)
  function sendSubtitleToBackend(text) {
    renderSignCaptionText(null, text);

    console.log("Processing subtitle with AI:", text);

    const filteredText = filterBracketedContent(text);
    if (!filteredText || filteredText.trim().length === 0) {
      console.log("Text sau khi lọc bracketed content rỗng, bỏ qua.");
      return;
    }

    const words = splitTextIntoWords(filteredText);
    if (!words || words.length === 0) {
      console.log("No meaningful words found after filtering, skipping backend lookup.");
      return;
    }

    const requestData = {
      videoId: getYouTubeVideoId() || window.location.href,
      words: words,
      text: filteredText
    };

    if (!chrome.runtime || !chrome.runtime.id) {
      // Fallback local
      const localSignData = processSubtitleLocally(text);
      if (localSignData && localSignData.length > 0) {
        playSegmentSignData(localSignData);
        appendToFullSignSequence(localSignData);  // ← Tích lũy vào mảng tổng hợp
      }
      return;
    }

    chrome.runtime.sendMessage({
      action: "fetch_dictionary_lookup",
      requestData: requestData
    }, (response) => {
      if (response && response.success && response.data && response.data.length > 0) {
        const receivedWords = response.data.map(item => item.word).join(', ');
        console.log(`🎯 Backend AI translation successful (observer mode). Input: "${text}" -> Output words: [${receivedWords}]`);
        renderSignCaptionText(response.data, text);
        playSegmentSignData(response.data);
        appendToFullSignSequence(response.data);  // ← Tích lũy vào mảng tổng hợp
      } else {
        if (handleQuotaOrAuthResponse(response)) return;
        console.warn("Backend AI translation failed or empty, falling back to local.");
        const localSignData = processSubtitleLocally(text);
        if (localSignData && localSignData.length > 0) {
          renderSignCaptionText(localSignData, text);
          playSegmentSignData(localSignData);
          appendToFullSignSequence(localSignData);  // ← Tích lũy vào mảng tổng hợp
        }
      }
    });
  }

  function startSubtitleObserver() {
    if (observer) observer.disconnect();

    const targetNode = document.querySelector('.html5-video-player') || document.body;
    const captionWindow = document.querySelector('.ytp-caption-window-container') ||
      document.querySelector('.caption-window') ||
      document.querySelector('.ytp-caption-region');

    if (!captionWindow) {
      setTimeout(() => {
        const retryCaptionWindow = document.querySelector('.ytp-caption-window-container') ||
          document.querySelector('.caption-window') ||
          document.querySelector('.ytp-caption-region');
        if (!retryCaptionWindow) {
          console.warn("Caption window was not created yet; waiting for YouTube to render captions.");
        }
      }, 1500);
    }

    // Log available caption elements for debugging
    setTimeout(() => {
      const allCaptionElements = document.querySelectorAll('[class*="caption"], [class*="ytp-caption"], .caption-visual-line, span');
      console.log("Found potential caption elements:", allCaptionElements.length);
      if (allCaptionElements.length > 0) {
        console.log("Sample caption elements:", Array.from(allCaptionElements).slice(0, 5).map(el => ({
          tag: el.tagName,
          class: el.className,
          text: el.textContent?.substring(0, 30)
        })));
      }
    }, 3000);

    observer = new MutationObserver(() => {
      // Only look for text within the caption window to avoid picking up page content
      const captionWindow = document.querySelector('.ytp-caption-window-container') ||
        document.querySelector('.caption-window') ||
        document.querySelector('.ytp-caption-region');

      if (!captionWindow) {
        return; // No caption window found, skip
      }

      // Select only leaf segment elements to avoid duplicates from parent containers and helper elements
      let segments = captionWindow.querySelectorAll('.ytp-caption-segment');
      if (segments.length === 0) {
        segments = captionWindow.querySelectorAll('.caption-visual-line');
      }
      if (segments.length === 0) {
        segments = captionWindow.querySelectorAll('span');
      }

      if (segments && segments.length > 0) {
        const fullText = Array.from(segments)
          .map(el => el.textContent.trim())
          .filter(text => text.length > 0)
          .join(" ")
          .trim();

        // Làm sạch text ASR: bỏ ký hiệu đổi người nói ">>", nhiễu UI, timestamp...
        let filteredText = fullText
          .replace(/Tap to unmute/gi, '')
          .replace(/Auto-generated/gi, '')
          .replace(/>>+/g, ' ')            // ">>" là dấu đổi người nói trong ASR, bỏ đi
          .replace(/\d+:\d+/g, '')          // timestamps
          .replace(/\d+\s*views/gi, '')
          .replace(/\d+\s*(years?|months?|weeks?|days?|hours?|minutes?|seconds?)\s*ago/gi, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Gộp các câu lặp liền kề (ASR hay nhân đôi câu khi cuộn), ví dụ
        // "Ăn tươi thì ghê. Ăn tươi thì ghê." -> "Ăn tươi thì ghê."
        filteredText = dedupeRepeatedSentences(filteredText);

        if (!filteredText || filteredText.length < 2) return;

        // Chỉ xử lý khi chữ đã "ổn định" (ngừng thay đổi), và chỉ dịch PHẦN MỚI.
        pendingCaption = filteredText;
        clearTimeout(subtitleDebounceTimeout);
        subtitleDebounceTimeout = setTimeout(() => {
          const text = pendingCaption;
          if (!text || text === lastSentSubtitle) return;

          let delta = text;
          // Câu mới là phần mở rộng của câu đã gửi -> chỉ lấy đuôi mới.
          if (lastSentSubtitle && text.startsWith(lastSentSubtitle)) {
            delta = text.slice(lastSentSubtitle.length).trim();
          } else if (lastSentSubtitle) {
            // ASR cuộn: tìm phần chung ở cuối câu cũ trùng đầu câu mới, cắt bỏ.
            delta = stripOverlapPrefix(lastSentSubtitle, text);
          }
          lastSentSubtitle = text;
          lastSubtitleText = text;

          if (delta && delta.replace(/[^\p{L}]/gu, '').length > 1) {
            sendSubtitleToBackend(delta);
          }
        }, 450);
      }
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      characterData: true
    });

    console.log("DOM Observer started with enhanced caption selectors");
  }

  // Gửi thông tin Video (ID & URL) sang Backend
  function sendVideoInfoToBackend(videoId, videoUrl) {
    if (!videoId || !chrome.runtime || !chrome.runtime.id) return;

    const payload = {
      videoId: videoId,
      videoUrl: videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
      title: document.title || ""
    };

    chrome.runtime.sendMessage({
      action: "save_video_info",
      data: payload
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("sendVideoInfoToBackend message error:", chrome.runtime.lastError.message);
        return;
      }
      if (response && response.success) {
        console.log("🚀 [Signify] Video info successfully sent to Backend!");
      }
    });
  }

  // 9. Page Lifecycle and Navigation Monitor
  async function handlePageTransition() {
    // Chỉ chạy khi user đã bật nút dịch
    if (!translationEnabled) return;

    const currentVideoId = getYouTubeVideoId();
    if (!currentVideoId) {
      // Not on a watch page
      activeVideoId = "";
      fullTranscript = [];
      lastActiveSegment = null;
      isSyncActive = false;
      setHideNativeCaptions(false); // Rời trang watch: trả CC về bình thường
      stopUsageSession();
      return;
    }

    if (currentVideoId !== activeVideoId) {
      const videoUrl = window.location.href;
      console.log(`==================================================`);
      console.log(`🎬 [Signify] YouTube Video Info:`);
      console.log(`📌 Video ID  : ${currentVideoId}`);
      console.log(`🔗 Video URL : ${videoUrl}`);
      console.log(`==================================================`);

      stopUsageSession();
      activeVideoId = currentVideoId;
      startUsageSession();
      fullTranscript = [];
      lastActiveSegment = null;
      isSyncActive = false;
      lastSubtitleText = "";
      lastSentSubtitle = "";
      pendingCaption = "";

      // Gửi toàn bộ chuỗi ký hiệu cuối cùng lên BE TRƯỚC khi reset (chỉ gửi 1 lần dựa trên mảng đầy đủ)
      if (fullSignSequence.length > 0) {
        console.log(`📤 [Signify] Đang gửi fullSignSequence cuối cùng lên BE (${fullSignSequence.length} ký hiệu) trước khi đổi video...`);
        sendFullSignSequenceToBackend();
      }
      fullSignSequence = [];  // Reset mảng ký hiệu sau khi đã gửi BE

      const captionText = document.getElementById('signify-caption-text');
      if (captionText) captionText.textContent = "Đang kiểm tra dữ liệu video...";

      // Kiểm tra nếu là 1 trong 3 video demo -> khởi chạy demo timeline local
      const demoTimelinePath = getDemoTimelinePath(currentVideoId);
      if (demoTimelinePath) {
        console.log(`🌟 [Signify] VideoId "${currentVideoId}" thuộc 3 demo! Khởi chạy demo timeline local: ${demoTimelinePath}`);
        const loaded = await loadDemoTimeline(demoTimelinePath);
        if (loaded) return;
      }

      console.log(`🔍 [Signify Extension] Gửi GET request đến BE kiểm tra trường signLanguage cho videoId: "${currentVideoId}"`);

      // Gửi GET request tới BE để kiểm tra AI youtube đã có trường signLanguage chưa
      chrome.runtime.sendMessage({
        action: "get_video_info",
        videoId: currentVideoId
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("⚠️ [Signify Extension] get_video_info message error:", chrome.runtime.lastError.message);
        }

        const signLanguageStr = (response && response.success && response.data) ? response.data.signLanguage : null;

        if (signLanguageStr && signLanguageStr.trim().length > 0) {
          // Tách các từ ký hiệu ngăn cách bằng dấu phẩy
          const words = signLanguageStr.split(',').map(w => w.trim()).filter(w => w.length > 0);

          console.group(`🎯 [Signify Extension] BE ĐÃ CÓ sẵn trường signLanguage cho video: ${currentVideoId}`);
          console.log(`📌 Chuỗi signLanguage từ BE: "${signLanguageStr}"`);
          console.log(`📌 Tổng số từ ký hiệu: ${words.length}`);
          console.log(`📌 Danh sách từ:`, words);
          console.log(`🚀 Bỏ qua gọi AI response, sử dụng dữ liệu sẵn có từ BE để phát ký hiệu.`);
          console.groupEnd();

          if (captionText) captionText.textContent = "Đã nạp ký hiệu ngôn ngữ có sẵn từ máy chủ!";

          const cachedSignDataList = [];
          for (const word of words) {
            const animationUrl = mapWordToAnimation(word);
            cachedSignDataList.push({
              word: word,
              animation: animationUrl
            });
          }

          if (cachedSignDataList.length > 0) {
            console.log(`🎬 [Signify Extension] Tiến hành phát ${cachedSignDataList.length} ký hiệu đã lấy từ BE...`);
            playSegmentSignData(cachedSignDataList);

            // Đã lấy được signLanguage từ BE => không cần bật observer AI dịch nữa
            if (observer) {
              observer.disconnect();
              observer = null;
            }
            return;
          }
        }

        // Nếu CHƯA CÓ trường signLanguage trên BE (Lần đầu tiên xem video này):
        console.group(`ℹ️ [Signify Extension] BE CHƯA CÓ trường signLanguage cho video: ${currentVideoId}`);
        console.log(`📌 Lần đầu tiên xem video này -> Tiến hành bật cào phụ đề & gọi AI Response.`);
        console.log(`📌 Sau khi xem xong, chuỗi ký hiệu dịch được sẽ được gửi lên BE để tạo trường signLanguage.`);
        console.groupEnd();

        // Gửi thông tin Video (ID & URL) về Backend để tạo record
        sendVideoInfoToBackend(currentVideoId, videoUrl);

        setTimeout(() => {
          activateObserverFallback("dùng observer trực tiếp");
        }, 300);
      });
    } else if (!isSyncActive) {
      // In case we are on the same video but the video element re-rendered
      startTimelineSync();
    }
  }

  // Toggle controller
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggle_overlay') {
      overlayVisible = !overlayVisible;
      if (overlayContainer) {
        overlayContainer.style.display = overlayVisible ? 'flex' : 'none';
      }
      // Ẩn overlay -> hiện lại CC gốc; hiện overlay lại -> ẩn CC (nếu đang chạy chế độ observer)
      setHideNativeCaptions(overlayVisible && !!observer);
      sendResponse({ status: overlayVisible ? 'Visible' : 'Hidden' });
    }

    // Test function for manual subtitle processing
    if (message.action === 'test_subtitle') {
      const testText = message.text || "xin chào mọi người";
      console.log("Testing subtitle processing with:", testText);
      const localSignData = processSubtitleLocally(testText);
      console.log("Local processing result:", localSignData);
      if (localSignData && localSignData.length > 0) {
        playSegmentSignData(localSignData);
        sendResponse({ success: true, data: localSignData });
      } else {
        sendResponse({ success: false, error: "Local processing returned empty" });
      }
    }
  });

  // Initialize Overlay and start monitoring
  function init() {
    console.log("Initializing Signify extension...");
    try {
      // Set YouTube API key
      chrome.runtime.sendMessage({
        action: "set_youtube_api_key",
        apiKey: ""
      }, (response) => {
        if (response && response.success) {
          console.log("YouTube API key set successfully");
        } else {
          console.warn("Failed to set YouTube API key");
        }
      });

      createOverlay();
      handlePageTransition();

      // Polling monitor for Single Page App (SPA) navigation or DOM recreation
      setInterval(() => {
        if (overlayVisible && !document.getElementById('signify-overlay')) {
          console.log("Recreating missing overlay...");
          createOverlay();
        }
        handlePageTransition();
      }, 2500);
    } catch (e) {
      console.error("Init failed:", e);
    }
  }

  // Initial delay
  console.log("Scheduling init in 2 seconds...");
  setTimeout(init, 2000);

})();
