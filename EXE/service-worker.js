// Mở Side Panel khi bấm icon extension
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (err) {
    console.error("Failed to open side panel:", err);
  }
});

// ===== RELAY MESSAGE =====
// Content script (content.js) KHÔNG thể gửi message thẳng tới side panel trong MV3.
// Service worker nhận message từ content.js rồi forward sang tất cả port đang mở (side panel).
const sidePanelPorts = new Set();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "sidepanel") {
    sidePanelPorts.add(port);
    port.onDisconnect.addListener(() => {
      sidePanelPorts.delete(port);
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  // Chỉ relay message từ content script (có sender.tab)
  if (sender.tab) {
    for (const port of sidePanelPorts) {
      try {
        port.postMessage(message);
      } catch (e) {
        // port đã bị đóng
        sidePanelPorts.delete(port);
      }
    }
  }
});