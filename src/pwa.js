import { registerSW } from 'virtual:pwa-register';

export function setupPwa({ notify, showInstallGuide }) {
  const installButton = document.querySelector('#install-button');
  const installText = document.querySelector('#install-text');
  const offlineLabel = document.querySelector('#offline-label');
  const updateNotice = document.querySelector('#update-notice');
  let installPrompt = null;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const markInstalled = () => { installButton.hidden = true; };
  if (standalone()) markInstalled();

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (!standalone()) { installButton.hidden = false; installText.textContent = '把小猪带回家'; }
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    markInstalled();
    notify('小猪住进桌面啦，随时都能碰碰！');
  });
  installButton.addEventListener('click', async () => {
    if (!installPrompt) { showInstallGuide(); return; }
    const prompt = installPrompt;
    installPrompt = null;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') markInstalled();
  });

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const applyUpdate = registerSW({
    immediate: true,
    onOfflineReady() {
      offlineLabel.hidden = false;
      notify('小猪准备好啦，下次没网络也能玩');
    },
    onNeedRefresh() { updateNotice.hidden = false; },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Check again after returning to the game, without reloading an active round.
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.onLine) registration.update().catch(() => {});
      });
      if (registration.active) offlineLabel.hidden = false;
    },
    onRegisterError() {
      offlineLabel.hidden = true;
      notify('离线准备暂未完成，联网时仍可正常玩');
    },
  });
  document.querySelector('#update-now').addEventListener('click', async () => {
    updateNotice.hidden = true;
    await applyUpdate(true);
  });
  document.querySelector('#update-later').addEventListener('click', () => { updateNotice.hidden = true; });
  window.addEventListener('offline', () => notify('暂时离线，小猪陪你继续玩'));
}
