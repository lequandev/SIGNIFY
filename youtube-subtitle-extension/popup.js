document.addEventListener('DOMContentLoaded', () => {
  const ytStatus = document.getElementById('yt-status');
  const beStatus = document.getElementById('be-status');
  const toggleBtn = document.getElementById('toggle-overlay');

  function checkBackendHealth(port) {
    beStatus.textContent = 'Đang kiểm tra...';
    beStatus.className = 'badge checking';

    fetch(`http://127.0.0.1:${port}/api/ai/dictionary-lookup`, {
      method: 'OPTIONS'
    }).then(() => {
      beStatus.textContent = `Kết nối (${port})`;
      beStatus.className = 'badge active';
    }).catch(() => {
      // Attempt GET ping to root in case options check is blocked
      fetch(`http://127.0.0.1:${port}/`).then(() => {
        beStatus.textContent = `Kết nối (${port})`;
        beStatus.className = 'badge active';
      }).catch(() => {
        beStatus.textContent = 'Ngoại tuyến';
        beStatus.className = 'badge inactive';
      });
    });
  }

  // Get active port from background
  chrome.runtime.sendMessage({ action: "get_active_port" }, (response) => {
    const port = response?.port || "8080";
    checkBackendHealth(port);
  });

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
