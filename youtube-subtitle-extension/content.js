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
    "canh chua", "nước mắm", "chua chua", "dễ ăn", "các kiểu", "trí tuệ nhân tạo",
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

  function splitTextIntoWords(text) {
    if (!text) return [];
    
    const words = [];
    const lowerText = text.toLowerCase().trim();
    
    let remainingText = lowerText;
    const sortedCompoundWords = Array.from(COMPOUND_WORDS).sort((a, b) => b.length - a.length);
    
    for (const compound of sortedCompoundWords) {
      const index = remainingText.indexOf(compound);
      if (index !== -1) {
        const beforeText = remainingText.substring(0, index).trim();
        if (beforeText) {
          const beforeWords = beforeText.split(/\s+/);
          beforeWords.forEach(w => {
            if (w && !VIETNAMESE_STOPWORDS.has(w)) {
              words.push(w);
            }
          });
        }
        
        words.push(compound);
        remainingText = remainingText.substring(index + compound.length).trim();
      }
    }
    
    if (remainingText) {
      const remainingWords = remainingText.split(/\s+/);
      remainingWords.forEach(w => {
        if (w && !VIETNAMESE_STOPWORDS.has(w)) {
          words.push(w);
        }
      });
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
    const cleanWord = word.trim().toLowerCase().replace(/^[.,?!\-"]+|[.,?!\-"]+$/g, "");
    if (!cleanWord || VIETNAMESE_STOPWORDS.has(cleanWord)) return null;
    
    const cleanWordNoAccents = stripVietnameseAccents(cleanWord).replace(/\s+/g, "-");
    return `http://127.0.0.1:${activeBackendPort}/assets/animations/${cleanWordNoAccents}.mp4`;
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
  // 7. Core Subtitle loader & XML-JSON Parser
  async function loadVideoTranscript(playerResponse) {
    if (!playerResponse) {
      console.warn("YouTube Player Response is unavailable.");
      activateObserverFallback("Không tải được thông tin video.");
      return;
    }

    try {
      const captions = playerResponse.captions;
      if (!captions || !captions.playerCaptionsTracklistRenderer) {
        console.warn("This video has no pre-rendered captions/transcripts.");
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

      console.log(`Loading caption track: ${selectedTrack.name.simpleText || selectedTrack.languageCode}`);
      const captionUrl = selectedTrack.baseUrl + '&fmt=json3';

      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          throw new Error("Chrome runtime not available");
        }

        const text = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            action: "fetch_youtube_caption",
            url: captionUrl
          }, (res) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (res && res.success) {
              resolve(res.text);
            } else {
              reject(new Error(res?.error || "Unknown background fetch error"));
            }
          });
        });

        if (!text || text.trim().length === 0) {
          console.warn("Caption response is empty");
          throw new Error("Caption response is empty");
        }

        const data = JSON.parse(text);
        if (!data || !data.events) {
          console.warn("Caption data has no events");
          throw new Error("Phụ đề rỗng.");
        }

        // De-active DOM observer as we have robust timeline transcript data
        if (observer) {
          observer.disconnect();
          observer = null;
        }

        // Format JSON3 to timeline segments
        fullTranscript = data.events
          .filter(ev => ev.segs && ev.segs.some(s => s.utf8.trim().length > 0))
          .map(ev => {
            const start = ev.tStartMs;
            const duration = ev.dDurationMs || 0;
            const text = ev.segs.map(s => s.utf8).join(" ").replace(/\n/g, " ").trim();
            return {
              start: start,
              end: start + duration,
              text: text,
              translatedSignData: null,
              isFetching: false
            };
          });

        console.log(`Successfully parsed ${fullTranscript.length} sync-timeline caption segments!`);

        const captionText = document.getElementById('signify-caption-text');
        if (captionText) captionText.textContent = "Đang dịch trước phụ đề...";

        // Trigger pre-fetching of all translations (AI-Backend-First Approach)
        if (fullTranscript.length > 0) {
          const captionText = document.getElementById('signify-caption-text');
          if (captionText) captionText.textContent = "Đang đồng bộ phụ đề với AI...";

          let completedCount = 0;

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
                completedCount++;
                if (response && response.success && response.data && response.data.length > 0) {
                  seg.translatedSignData = response.data;
                } else {
                  // Fallback locally
                  seg.translatedSignData = processSubtitleLocally(seg.text);
                }

                if (captionText) {
                  captionText.textContent = `Đang dịch phụ đề (${completedCount}/${fullTranscript.length})...`;
                  if (completedCount === fullTranscript.length) {
                    captionText.textContent = "Signify đã đồng bộ dòng thời gian!";
                  }
                }
              });
            } else {
              // Fallback locally immediately
              seg.translatedSignData = processSubtitleLocally(seg.text);
              completedCount++;
              if (captionText) {
                captionText.textContent = `Đang dịch phụ đề (${completedCount}/${fullTranscript.length})...`;
                if (completedCount === fullTranscript.length) {
                  captionText.textContent = "Signify đã đồng bộ dòng thời gian!";
                }
              }
            }
          });
        }

        startTimelineSync();
      } catch (e) {
        console.error("Timeline caption retrieval failed:", e);
        activateObserverFallback("Lỗi đồng bộ dòng thời gian.");
      }
    } catch (e) {
      console.error("loadVideoTranscript error:", e);
      activateObserverFallback("Lỗi tải phụ đề.");
    }
  }

  // Backup fallback: DOM-scraping observer if the caption API is blocked/unavailable
  function activateObserverFallback(reason) {
    console.log(`⚠️ Activating DOM Observer Fallback. Reason: ${reason}`);
    const captionText = document.getElementById('signify-caption-text');
    if (captionText) captionText.textContent = "Chế độ nhận diện trực tiếp...";

    startSubtitleObserver();
  }

  // 8. Legacy MutationObserver Fallback loop (AI-Backend-First Approach)
  function sendSubtitleToBackend(text) {
    const captionText = document.getElementById('signify-caption-text');
    if (captionText) captionText.textContent = text;

    console.log("Processing subtitle with AI:", text);

    const words = splitTextIntoWords(text);
    const requestData = {
      videoId: window.location.href,
      words: words,
      text: text
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

        // Filter out common YouTube UI text that might appear
        const filteredText = fullText
          .replace(/Tap to unmute/g, '')
          .replace(/Auto-generated/g, '')
          .replace(/\d+:\d+/g, '') // Remove timestamps
          .replace(/\d+\s*views/g, '') // Remove view counts
          .replace(/\d+\s*(years?|months?|weeks?|days?|hours?|minutes?|seconds?)\s*ago/gi, '') // Remove time ago
          .trim();

        console.log("Observer detected caption text:", filteredText);

        if (filteredText && filteredText !== lastSubtitleText && filteredText.length > 2) {
          lastSubtitleText = filteredText;

          clearTimeout(subtitleDebounceTimeout);
          subtitleDebounceTimeout = setTimeout(() => {
            if (filteredText !== lastSentSubtitle) {
              sendSubtitleToBackend(filteredText);
              lastSentSubtitle = filteredText;
            }
          }, 350);
        }
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
      return;
    }

    if (currentVideoId !== activeVideoId) {
      console.log(`🔄 Navigated to new YouTube Video: ${currentVideoId}`);
      activeVideoId = currentVideoId;
      fullTranscript = [];
      lastActiveSegment = null;
      isSyncActive = false;

      const captionText = document.getElementById('signify-caption-text');
      if (captionText) captionText.textContent = "Đang đồng bộ phụ đề...";

      // Short delay to let YouTube populate ytInitialPlayerResponse
      setTimeout(async () => {
        const response = await requestPlayerResponseFromPage();
        loadVideoTranscript(response);
      }, 1500);
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
