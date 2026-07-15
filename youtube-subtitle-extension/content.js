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

  let activeBackendPort = "8080";
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get("backendPort", (data) => {
      if (data.backendPort) {
        activeBackendPort = data.backendPort;
        console.log("content.js loaded active port from storage:", activeBackendPort);
      }
    });
  }

  // Listen for storage changes to update port dynamically
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.backendPort && changes.backendPort.newValue) {
        activeBackendPort = changes.backendPort.newValue;
        console.log("content.js updated active port dynamically:", activeBackendPort);
      }
    });
  }

  function mapWordToAnimation(word) {
    const cleanWord = word.trim().replace(/^[.,?!\-"]+|[.,?!\-"]+$/g, "");
    if (!cleanWord || !isMeaningfulWord(cleanWord)) return null;

    // Tên file luôn không dấu + chữ thường, nối bằng '-'.
    const fileKey = stripVietnameseAccents(cleanWord.toLowerCase()).replace(/\s+/g, "-");
    return `http://127.0.0.1:${activeBackendPort}/assets/animations/${fileKey}.mp4`;
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

    // Modern glowing glassmorphic overlay design
    overlayContainer.innerHTML = `
      <div class="signify-overlay-header">
        <span class="signify-logo-text">🧬 TRÌNH DỊCH SIGNIFY</span>
        <button class="signify-close-btn" id="signify-close-btn">×</button>
      </div>
      <div class="signify-video-container">
        <!-- High performance video player for local/cloud sign language mp4 clips -->
        <video id="signify-video-player" class="signify-video" style="display:none;" muted autoplay></video>

        <!-- Premium glassmorphic text-card fallback when no mp4 is found -->
        <div id="signify-fallback-card" class="signify-fallback-card">
          <span class="signify-fallback-label">DỊCH KÝ HIỆU</span>
          <span id="signify-fallback-word" class="signify-fallback-word">Chờ dịch...</span>
        </div>
      </div>
      <p class="signify-caption-text" id="signify-caption-text">Chờ phụ đề...</p>
    `;

    // Append to YouTube Player container or body
    const ytPlayer = document.querySelector('.html5-video-player') || document.body;
    console.log("Appending overlay to:", ytPlayer);
    ytPlayer.appendChild(overlayContainer);
    console.log("Overlay created successfully");

    // Bind Close Event
    const closeBtn = document.getElementById('signify-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlayVisible = false;
        overlayContainer.style.display = 'none';
        setHideNativeCaptions(false); // Đóng overlay: hiện lại CC gốc của YouTube
      });
    }

    // Bind video events safely
    const videoPlayer = document.getElementById('signify-video-player');
    videoPlayer.addEventListener('ended', playNextAnimation);
    videoPlayer.addEventListener('error', (e) => {
      console.warn("Video failed to play, defaulting to text card fallback:", e);
      handlePlaybackError();
    });
  }

  // Handle playback failures smoothly without freezing the animation queue
  function handlePlaybackError() {
    const videoPlayer = document.getElementById('signify-video-player');
    const fallbackCard = document.getElementById('signify-fallback-card');

    if (videoPlayer) videoPlayer.style.display = 'none';
    if (fallbackCard) fallbackCard.style.display = 'flex';

    clearTimeout(animationTimeout);
    animationTimeout = setTimeout(playNextAnimation, 600);
  }

  // 2. Queue Manager to Play Animations Sequentially
  function playNextAnimation() {
    clearTimeout(animationTimeout);

    const videoPlayer = document.getElementById('signify-video-player');
    const fallbackCard = document.getElementById('signify-fallback-card');
    const fallbackWord = document.getElementById('signify-fallback-word');

    if (animationQueue.length === 0) {
      isPlaying = false;
      // Revert to wait state when done
      if (videoPlayer) videoPlayer.style.display = 'none';
      if (fallbackCard) fallbackCard.style.display = 'flex';
      return;
    }

    isPlaying = true;
    const currentSign = animationQueue.shift();

    if (fallbackWord) fallbackWord.textContent = currentSign.word;

    // UPGRADED CHECK: Support both Base64 Data URL and HTTP MP4 videos safely!
    const hasVideo = currentSign.animation && (
      currentSign.animation.startsWith('data:') ||
      currentSign.animation.includes('.mp4')
    );

    if (hasVideo) {
      if (fallbackCard) fallbackCard.style.display = 'none';
      if (videoPlayer) {
        videoPlayer.style.display = 'block';
        videoPlayer.src = currentSign.animation;
        videoPlayer.load();

        // Autoplay policy check
        videoPlayer.play().catch(err => {
          console.warn("Autoplay was blocked or interrupted. Using card fallback:", err);
          if (videoPlayer) videoPlayer.style.display = 'none';
          if (fallbackCard) fallbackCard.style.display = 'flex';
          animationTimeout = setTimeout(playNextAnimation, 600);
        });
      }
    } else {
      // Standard text-card display fallback
      if (videoPlayer) videoPlayer.style.display = 'none';
      if (fallbackCard) fallbackCard.style.display = 'flex';
      animationTimeout = setTimeout(playNextAnimation, 600);
    }
  }

  // 3. Play Segment-Specific Sign Language Sequences
  function playSegmentSignData(signDataList) {
    animationQueue = [...signDataList];
    const videoPlayer = document.getElementById('signify-video-player');
    if (videoPlayer) {
      videoPlayer.pause();
    }
    isPlaying = false;
    playNextAnimation();
  }

  // 4. Send Subtitle Segment to Local Backend for Translation (AI-Backend-First with Local Fallback)
  function fetchSegmentTranslation(segment) {
    const words = splitTextIntoWords(segment.text);
    const requestData = {
      videoId: window.location.href,
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
        segment.translatedSignData = response.data;
        if (lastActiveSegment === segment) {
          playSegmentSignData(segment.translatedSignData);
        }
      } else {
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
      const requestData = {
        videoId: window.location.href,
        words: words,
        text: seg.text
      };

      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          action: "fetch_dictionary_lookup",
          requestData: requestData
        }, (response) => {
          if (response && response.success && response.data && response.data.length > 0) {
            seg.translatedSignData = response.data;
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
    const captionText = document.getElementById('signify-caption-text');
    if (captionText) captionText.textContent = text;

    console.log("Processing subtitle with AI:", text);

    const filteredText = filterBracketedContent(text);
    if (!filteredText || filteredText.trim().length === 0) {
      console.log("Text sau khi lọc bracketed content rỗng, bỏ qua.");
      return;
    }

    const words = splitTextIntoWords(filteredText);
    const requestData = {
      videoId: window.location.href,
      words: words,
      text: filteredText
    };

    if (!chrome.runtime || !chrome.runtime.id) {
      // Fallback local
      const localSignData = processSubtitleLocally(text);
      if (localSignData && localSignData.length > 0) {
        playSegmentSignData(localSignData);
      }
      return;
    }

    chrome.runtime.sendMessage({
      action: "fetch_dictionary_lookup",
      requestData: requestData
    }, (response) => {
      if (response && response.success && response.data && response.data.length > 0) {
        console.log("🎯 Backend AI translation successful (observer mode):", text);
        playSegmentSignData(response.data);
      } else {
        console.warn("Backend AI translation failed or empty, falling back to local.");
        const localSignData = processSubtitleLocally(text);
        if (localSignData && localSignData.length > 0) {
          playSegmentSignData(localSignData);
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

  // 9. Page Lifecycle and Navigation Monitor
  async function handlePageTransition() {
    const currentVideoId = getYouTubeVideoId();
    if (!currentVideoId) {
      // Not on a watch page
      activeVideoId = "";
      fullTranscript = [];
      lastActiveSegment = null;
      isSyncActive = false;
      setHideNativeCaptions(false); // Rời trang watch: trả CC về bình thường
      return;
    }

    if (currentVideoId !== activeVideoId) {
      console.log(`🔄 Navigated to new YouTube Video: ${currentVideoId}`);
      activeVideoId = currentVideoId;
      fullTranscript = [];
      lastActiveSegment = null;
      isSyncActive = false;
      lastSubtitleText = "";
      lastSentSubtitle = "";
      pendingCaption = "";

      const captionText = document.getElementById('signify-caption-text');
      if (captionText) captionText.textContent = "Đang chuẩn bị dịch phụ đề...";

      // YouTube đã chặn cào timedtext trực tiếp (mọi format trả rỗng nếu thiếu pot token),
      // và endpoint backend /youtube-transcript cũng luôn rỗng vì lý do đó — nên KHÔNG gọi nó
      // nữa (tránh phí ~10s chờ). Vào thẳng đường CHÍNH: bật ngầm CC + ẩn CSS + observer đọc DOM.
      // -> giảm độ trễ khởi động từ ~11s xuống gần như tức thì.
      setTimeout(() => {
        activateObserverFallback("dùng observer trực tiếp");
      }, 300);
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
        apiKey: "AIzaSyAhoS5UX3bxeUpHI2SyjGLOifh7coDEIb4"
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
