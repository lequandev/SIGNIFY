// Signify Local Word Dictionary - Frontend Word Splitting
// Dictionary of common Vietnamese words and phrases for sign language mapping

const CLOUDINARY_VIDEO_BASE_URL = "https://res.cloudinary.com/rlj4wvvu/video/upload";

const VIETNAMESE_STOPWORDS = new Set([
  // Common conversational fillers, particles and slang
  "nè", "nha", "nhé", "nhỉ", "à", "ơi", "ớ", "ừ", "dạ", "vâng", "bạn", "các", "kiểu", "cơ", "đấy", "thế",
  "này", "kia", "nọ", "nhe", "nha", "ờ", "ờm", "thì", "mà",
  // Grammatical stop words & link words (never used in sign language)
  "là", "còn", "và", "hoặc", "nhưng", "tuy", "tại", "do", "bởi", "đang", "đã", "vừa", "mới", "sẽ",
  "cũng", "như", "nó", "họ", "chúng", "mình", "tôi", "tớ", "ta", "cậu", "chúng tôi", "chúng ta",
  "này", "đó", "ấy", "rồi", "lại", "nơi", "nào", "gì", "ai", "đâu", "sao", "bao", "quá", "rất", "lắm", "hơi",
  "cực", "kỳ", "món", "để", "cho", "hơn",
  // Punctuation, ASR noise, symbols & garbage tokens
  ">>", "<<", "->", "=>", "http", "https", ">", "<", "các kiểu"
]);

// Load compound words from JSON file
let COMPOUND_WORDS = new Set();

async function loadCompoundWords() {
  try {
    const response = await fetch(chrome.runtime.getURL('vietnameseCompoundWords.json'));
    const data = await response.json();
    COMPOUND_WORDS = new Set(data.compound_words);
    console.log("Loaded", COMPOUND_WORDS.size, "compound words from JSON");
  } catch (error) {
    console.error("Failed to load compound words JSON, using fallback:", error);
    // Fallback to basic compound words if JSON fails to load
    COMPOUND_WORDS = new Set([
      "xin chào", "mọi người", "chào mừng", "hôm nay", "âm nhạc", "bài hát"
    ]);
  }
}

// Initialize compound words
loadCompoundWords();

// Helper function to strip Vietnamese accents
function stripVietnameseAccents(str) {
  if (!str) return "";
  const normalized = str.normalize("NFD");
  const pattern = /[\u0300-\u036f]/g;
  return normalized.replace(pattern, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

// Helper function to check if a word is a compound word
function isCompoundWord(text) {
  const lowerText = text.toLowerCase().trim();
  return COMPOUND_WORDS.has(lowerText);
}

// Helper function to split text into words/phrases
function splitTextIntoWords(text) {
  if (!text) return [];
  
  const words = [];
  const lowerText = text.toLowerCase().trim();
  
  // First, try to match compound words
  let remainingText = lowerText;
  
  // Sort compound words by length (longest first) to match "xin chào" before "xin"
  const sortedCompoundWords = Array.from(COMPOUND_WORDS).sort((a, b) => b.length - a.length);
  
  for (const compound of sortedCompoundWords) {
    const index = remainingText.indexOf(compound);
    if (index !== -1) {
      // Add text before compound
      const beforeText = remainingText.substring(0, index).trim();
      if (beforeText) {
        const beforeWords = beforeText.split(/\s+/);
        beforeWords.forEach(w => {
          if (w && !VIETNAMESE_STOPWORDS.has(w)) {
            words.push(w);
          }
        });
      }
      
      // Add the compound word
      words.push(compound);
      
      // Update remaining text
      remainingText = remainingText.substring(index + compound.length).trim();
    }
  }
  
  // Add remaining words
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

// Helper function to map word to animation URL
function mapWordToAnimation(word) {
  const cleanWord = word.trim().toLowerCase().replace(/^[.,?!\-"]+|[.,?!\-"]+$/g, "");
  if (!cleanWord || VIETNAMESE_STOPWORDS.has(cleanWord)) return null;
  
  const cleanWordNoAccents = stripVietnameseAccents(cleanWord).replace(/\s+/g, "-");
  return `${CLOUDINARY_VIDEO_BASE_URL}/${cleanWordNoAccents}.mp4`;
}

// Main function to process subtitle locally
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

// Function to identify words that need AI fallback (not in dictionary)
function identifyUnknownWords(subtitle) {
  if (!subtitle) return [];
  
  const words = splitTextIntoWords(subtitle);
  const unknownWords = [];
  
  for (const word of words) {
    // If word is not a common compound word, it might need AI processing
    if (!COMPOUND_WORDS.has(word.toLowerCase())) {
      unknownWords.push(word);
    }
  }
  
  return unknownWords;
}

// Export functions for use in content.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    processSubtitleLocally,
    identifyUnknownWords,
    splitTextIntoWords,
    mapWordToAnimation,
    VIETNAMESE_STOPWORDS,
    COMPOUND_WORDS
  };
}
