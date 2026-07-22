// Signify Chrome Extension - Safely injected into YouTube page context to read player data
(function() {
  const response = window.ytInitialPlayerResponse || 
                   (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args && window.ytplayer.config.args.raw_player_response);
  window.postMessage({ type: 'SIGNIFY_YT_RESPONSE', data: response }, '*');
})();
