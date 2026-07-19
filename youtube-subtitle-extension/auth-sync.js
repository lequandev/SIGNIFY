// Sync Signify web auth token into the extension storage.
// Runs only on the local Signify frontend origin.
(function () {
  function syncAuth() {
    try {
      const token = window.localStorage.getItem('token');
      const user = window.localStorage.getItem('user');

      if (token) {
        chrome.storage.local.set({ signifyAuthToken: token, signifyUser: user || null });
      } else {
        chrome.storage.local.remove(['signifyAuthToken', 'signifyUser']);
      }
    } catch (error) {
      console.warn('Signify auth sync failed:', error);
    }
  }

  syncAuth();
  window.addEventListener('storage', syncAuth);
  window.setInterval(syncAuth, 3000);
})();
