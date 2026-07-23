document.addEventListener('DOMContentLoaded', () => {
  const ytStatus = document.getElementById('yt-status');
  const beStatus = document.getElementById('be-status');
  const toggleBtn = document.getElementById('toggle-overlay');

  const BACKEND_URL = "https://signify-g3zb.onrender.com";

  function checkBackendHealth() {
    beStatus.textContent = 'Đang kiểm tra...';
    beStatus.className = 'badge checking';

    fetch(`${BACKEND_URL}/api/ai/dictionary-lookup`, {
      method: 'OPTIONS'
    }).then(() => {
      beStatus.textContent = 'Kết nối';
      beStatus.className = 'badge active';
    }).catch(() => {
      // Attempt GET ping to root in case options check is blocked
      fetch(`${BACKEND_URL}/`).then(() => {
        beStatus.textContent = 'Kết nối';
        beStatus.className = 'badge active';
      }).catch(() => {
        beStatus.textContent = 'Ngoại tuyến';
        beStatus.className = 'badge inactive';
      });
    });
  }

  checkBackendHealth();

  // 2. Detect active tab and YouTube Watch Page status
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && activeTab.url && activeTab.url.includes('youtube.com/watch')) {
      ytStatus.textContent = 'Đang mở';
      ytStatus.className = 'badge active';
    } else {
      ytStatus.textContent = 'Chưa mở';
      ytStatus.className = 'badge inactive';
    }
  });

  // 3. Toggle overlay display
  toggleBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'toggle_overlay' }, (response) => {
          console.log('Overlay toggle message status:', response);
        });
      }
    });
  });
});
