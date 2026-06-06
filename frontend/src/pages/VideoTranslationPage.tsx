import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Youtube, Search, ArrowLeft, Play, Sparkles, FileText, Clock, ExternalLink } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../services/api';

// Vietnamese Sign Language Stopwords
const VIETNAMESE_STOPWORDS = new Set([
  "nè", "nha", "nhé", "nhỉ", "à", "ơi", "ớ", "ừ", "dạ", "vâng", "bạn", "các", "kiểu", "cơ", "đấy", "thế",
  "này", "kia", "nọ", "nhe", "nha", "ờ", "ờm", "thì", "mà",
  "là", "còn", "và", "hoặc", "nhưng", "tuy", "tại", "do", "bởi", "đang", "đã", "vừa", "mới", "sẽ",
  "cũng", "như", "nó", "họ", "chúng", "mình", "tôi", "tớ", "ta", "cậu", "chúng tôi", "chúng ta",
  "này", "đó", "ấy", "rồi", "lại", "nơi", "nào", "gì", "ai", "đâu", "sao", "bao", "quá", "rất", "lắm", "hơi",
  "cực", "kỳ", "món", "để", "cho", "hơn",
  ">>", "<<", "->", "=>", "http", "https", ">", "<", "các kiểu"
]);

// Compound Words for better parsing
const COMPOUND_WORDS = new Set([
  "xin chào", "mọi người", "chào mừng", "hôm nay", "ngày mai", "ngày hôm qua",
  "canh chua", "nước mắm", "chua chua", "dễ ăn", "các kiểu", "trí tuệ nhân tạo",
  "xin lỗi", "cảm ơn", "tạm biệt", "làm ơn", "không sao", "được không",
  "thế nào", "như thế nào", "bao nhiêu", "bao lâu", "bao xa",
  "rất tốt", "rất đẹp", "rất hay", "rất vui", "rất buồn",
  "không được", "không thể", "không có", "không biết",
  "có thể", "có lẽ", "có lẽ là", "được rồi",
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

interface TranscriptEvent {
  start: number;
  end: number;
  text: string;
  translatedSignData?: any[];
}

const VideoTranslationPage: React.FC = () => {
  const navigate = useNavigate();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [transcript, setTranscript] = useState<TranscriptEvent[]>([]);
  const [activeSegment, setActiveSegment] = useState<TranscriptEvent | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // YouTube player state
  const [playerState, setPlayerState] = useState(-1);
  const playerRef = useRef<any>(null);

  // Sign Language Interpreter Player state
  const [animationQueue, setAnimationQueue] = useState<any[]>([]);
  const [currentAnimIndex, setCurrentAnimIndex] = useState(-1);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const [fallbackWord, setFallbackWord] = useState('');

  // 1. Helper to extract YouTube Video ID
  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 2. Load YouTube Iframe API
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // 3. String normalization
  const stripVietnameseAccents = (str: string) => {
    if (!str) return "";
    return str.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  };

  // 4. Split text into keywords (compound words prioritized)
  const splitTextIntoWords = (text: string) => {
    if (!text) return [];
    
    const words: string[] = [];
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
  };

  // 5. Map word to static path
  const mapWordToAnimation = (word: string) => {
    const cleanWord = word.trim().toLowerCase().replace(/^[.,?!\-"]+|[.,?!\-"]+$/g, "");
    if (!cleanWord || VIETNAMESE_STOPWORDS.has(cleanWord)) return null;
    
    const cleanWordNoAccents = stripVietnameseAccents(cleanWord).replace(/\s+/g, "-");
    const baseUrl = api.defaults.baseURL || 'http://localhost:8080/api';
    const host = baseUrl.replace('/api', '');
    return `${host}/assets/animations/${cleanWordNoAccents}.mp4`;
  };

  // 6. Process subtitle locally (fast path)
  const processSubtitleLocally = (text: string) => {
    const words = splitTextIntoWords(text);
    const signDataList: any[] = [];
    
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
  };

  // 7. Load transcript from backend when video changes
  const handleLoadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const id = extractVideoId(youtubeUrl);
    if (!id) {
      setError('Đường dẫn YouTube không hợp lệ. Vui lòng thử lại.');
      return;
    }

    setLoading(true);
    setTranscript([]);
    setActiveSegment(null);
    setVideoId(id);

    try {
      const response = await api.get(`/ai/youtube-transcript?videoId=${id}`);
      const rawEvents: TranscriptEvent[] = response.data;
      
      // Pre-translate segments locally or fallback to backend
      const processedEvents = rawEvents.map(event => {
        const localSignData = processSubtitleLocally(event.text);
        return {
          ...event,
          translatedSignData: localSignData
        };
      });

      setTranscript(processedEvents);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải phụ đề cho video này. Video có thể không có phụ đề công khai.');
    } finally {
      setLoading(false);
    }
  };

  // 8. YouTube Player initialization/destruction
  useEffect(() => {
    if (videoId && (window as any).YT && (window as any).YT.Player) {
      // Destroy previous player instance if any
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn("Failed to destroy player:", e);
        }
        playerRef.current = null;
      }

      // Initialize new player
      playerRef.current = new (window as any).YT.Player('youtube-iframe-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onStateChange: (event: any) => {
            setPlayerState(event.data);
          }
        }
      });
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // 9. Time update tracking loop
  useEffect(() => {
    let interval: any;
    if (playerState === 1) { // 1 = PLAYING
      interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const timeMs = playerRef.current.getCurrentTime() * 1000;
          setCurrentTime(timeMs);
        }
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [playerState]);

  // 10. Update active subtitle and trigger animations
  useEffect(() => {
    if (transcript.length === 0) return;

    const matched = transcript.find(seg => currentTime >= seg.start && currentTime <= seg.end);
    if (matched) {
      if (activeSegment !== matched) {
        setActiveSegment(matched);
        
        // Trigger animations for matched segment
        if (matched.translatedSignData && matched.translatedSignData.length > 0) {
          setAnimationQueue([...matched.translatedSignData]);
          setCurrentAnimIndex(0);
        } else {
          // If no sign data, perform dynamic fetch or empty queue
          setAnimationQueue([]);
          setCurrentAnimIndex(-1);
          setFallbackWord(matched.text);
        }
      }
    } else {
      // Keep activeSegment showing for 1.2s buffer
      if (activeSegment && (currentTime < activeSegment.start || currentTime > activeSegment.end + 1200)) {
        setActiveSegment(null);
        setAnimationQueue([]);
        setCurrentAnimIndex(-1);
        setFallbackWord('');
      }
    }
  }, [currentTime, transcript]);

  // 11. Custom Sign Language Video Playback controller
  useEffect(() => {
    if (animationQueue.length === 0 || currentAnimIndex === -1 || currentAnimIndex >= animationQueue.length) {
      return;
    }

    const currentAnim = animationQueue[currentAnimIndex];
    setFallbackWord(currentAnim.word);

    const videoPlayer = videoPlayerRef.current;
    if (videoPlayer) {
      videoPlayer.src = currentAnim.animation;
      videoPlayer.load();
      videoPlayer.play().catch(err => {
        console.warn("Autoplay sign language video blocked:", err);
        // Advance queue on error
        setTimeout(() => handleAnimEnded(), 800);
      });
    }
  }, [animationQueue, currentAnimIndex]);

  const handleAnimEnded = () => {
    if (currentAnimIndex < animationQueue.length - 1) {
      setCurrentAnimIndex(prev => prev + 1);
    } else {
      // Loop or clear
      setCurrentAnimIndex(-1);
    }
  };

  const handleAnimError = () => {
    console.warn("Error playing sign language video clip, skipping...");
    setTimeout(() => handleAnimEnded(), 600);
  };

  // Jump player to timestamp
  const seekTo = (ms: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(ms / 1000, true);
      setCurrentTime(ms);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto px-6 py-10 w-full flex flex-col gap-8">
        {/* Back and Title */}
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Quay về trang chủ
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2563EB]/15 text-[#3b82f6] rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Translation Live</span>
          </div>
        </div>

        {/* Input URL Card */}
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/60 rounded-3xl p-8 shadow-xl">
          <div className="max-w-2xl mx-auto text-center mb-6">
            <h1 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Trình Dịch Video YouTube Realtime
            </h1>
            <p className="text-sm text-slate-400">
              Dán đường dẫn YouTube công khai để tự động tách phụ đề và dịch ngôn ngữ ký hiệu tiếng Việt tức thời.
            </p>
          </div>

          <form onSubmit={handleLoadVideo} className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500">
                <Youtube className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Ví dụ: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl py-4 pl-12 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Dịch Ngay
                </>
              )}
            </button>
          </form>

          {error && (
            <p className="text-red-400 text-sm text-center mt-4 font-semibold">
              {error}
            </p>
          )}
        </div>

        {/* Video Player + Interpreter Overlay Grid */}
        {videoId && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: YouTube Player & Subtitle text */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="aspect-video w-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl relative">
                <div id="youtube-iframe-player" className="w-full h-full" />
              </div>
              
              {/* Captions Overlay Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex items-center justify-center min-h-[90px] text-center">
                {activeSegment ? (
                  <p className="text-lg md:text-xl font-medium text-white tracking-wide leading-relaxed">
                    {activeSegment.text}
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm italic">
                    Chờ phụ đề từ dòng thời gian video...
                  </p>
                )}
              </div>
            </div>

            {/* Right side: Sign Language Interpreter Overlay */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Interpreter Monitor Card */}
              <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                <div className="bg-slate-800/90 border-b border-slate-700/50 px-5 py-4 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-400" />
                    Phiên dịch ký hiệu Signify
                  </span>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                </div>
                
                {/* Sign language video area */}
                <div className="aspect-square bg-slate-950 flex items-center justify-center relative overflow-hidden p-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 pointer-events-none" />
                  
                  {/* High performance sign language mp4 video player */}
                  <video
                    ref={videoPlayerRef}
                    onEnded={handleAnimEnded}
                    onError={handleAnimError}
                    className="w-full h-full object-contain rounded-2xl shadow-inner"
                    style={{ display: currentAnimIndex !== -1 ? 'block' : 'none' }}
                    muted
                    autoPlay
                  />

                  {/* Fallback Word Card if no video playing */}
                  {currentAnimIndex === -1 && (
                    <div className="flex flex-col items-center justify-center text-center p-8 gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-blue-400 shadow-lg">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                          Từ khóa hiện tại
                        </span>
                        <h3 className="text-2xl font-black text-white capitalize px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/40 inline-block min-w-[120px]">
                          {fallbackWord || 'Chờ dịch...'}
                        </h3>
                      </div>
                    </div>
                  )}
                </div>

                {/* Queue words list display */}
                <div className="p-4 bg-slate-900/60 border-t border-slate-700/30 flex flex-wrap gap-2 items-center justify-center min-h-[60px]">
                  {animationQueue.length > 0 ? (
                    animationQueue.map((item, idx) => (
                      <span
                        key={idx}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all duration-300 ${
                          idx === currentAnimIndex
                            ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/45'
                            : idx < currentAnimIndex
                            ? 'bg-slate-800 text-slate-500 line-through'
                            : 'bg-slate-800 text-slate-300 border border-slate-700/40'
                        }`}
                      >
                        {item.word}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Chưa có từ khóa dịch cho phân đoạn này
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Transcript Panel */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl shadow-xl flex flex-col h-[320px]">
                <div className="px-5 py-4 border-b border-slate-700/50 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold">Bản dịch đồng bộ timeline</h3>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {transcript.map((item, idx) => {
                    const isActive = activeSegment === item;
                    
                    const formatTime = (ms: number) => {
                      const totalSecs = Math.floor(ms / 1000);
                      const mins = Math.floor(totalSecs / 60);
                      const secs = totalSecs % 60;
                      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                    };

                    return (
                      <button
                        key={idx}
                        onClick={() => seekTo(item.start)}
                        className={`text-left p-3 rounded-xl flex gap-3 transition-all cursor-pointer items-start text-xs border ${
                          isActive
                            ? 'bg-blue-600/15 border-blue-500/60 text-white shadow-lg'
                            : 'bg-slate-900/30 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700/50 text-slate-400'
                        }`}
                      >
                        <span className={`flex items-center gap-1 font-mono font-bold shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(item.start)}
                        </span>
                        <span className={`leading-relaxed ${isActive ? 'font-medium' : ''}`}>
                          {item.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default VideoTranslationPage;
