import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { promptInstall, isPWA } from '../serviceWorkerRegistration';

const PWAInstallBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isPWA()) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed the banner recently
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Listen for install prompt availability
    const handleInstallAvailable = () => {
      setShowBanner(true);
    };

    window.addEventListener('pwaInstallAvailable', handleInstallAvailable);
    
    // Check if prompt is already available
    if (window.deferredPrompt) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('pwaInstallAvailable', handleInstallAvailable);
    };
  }, []);

  const handleInstall = () => {
    promptInstall();
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
    setShowBanner(false);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      color: 'white',
      padding: '0.75rem 1rem',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      zIndex: 1000,
      maxWidth: '90%',
      width: '400px',
      animation: 'slideUp 0.3s ease'
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
          PlanEd installieren
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
          Für schnellen Zugriff auf Mac, iPad & mehr
        </div>
      </div>
      
      <button
        onClick={handleInstall}
        style={{
          background: 'white',
          color: '#3b82f6',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '0.85rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <Download size={16} /> Installieren
      </button>
      
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '0.25rem',
          opacity: 0.7
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default PWAInstallBanner;
