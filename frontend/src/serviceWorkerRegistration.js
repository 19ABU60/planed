// Service Worker Registration for PlanEd PWA

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';
      
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
          
          // Check for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content is available
                    console.log('[PWA] New content available, refresh to update.');
                    
                    // Show update notification
                    if (window.showUpdateNotification) {
                      window.showUpdateNotification();
                    }
                  } else {
                    // Content is cached for offline use
                    console.log('[PWA] Content cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[PWA] Service Worker unregister failed:', error);
      });
  }
}

// Check if app is installed as PWA
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// Prompt user to install PWA
export function promptInstall() {
  if (window.deferredPrompt) {
    window.deferredPrompt.prompt();
    window.deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
      }
      window.deferredPrompt = null;
    });
  }
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  console.log('[PWA] Install prompt available');
  
  // Dispatch custom event for React components
  window.dispatchEvent(new CustomEvent('pwaInstallAvailable'));
});

// Listen for app installed event
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed successfully');
  window.deferredPrompt = null;
});
