const APPLE_MOBILE = /iPad|iPhone|iPod/;
const FIREFOX_ANDROID = /Android.*Firefox\//;
const STANDALONE = '(display-mode: standalone)';

export const isFirefoxAndroid = () => FIREFOX_ANDROID.test(navigator.userAgent);

export const isAppleMobile = () => {
  const { userAgent, maxTouchPoints } = navigator;
  return APPLE_MOBILE.test(userAgent) || (userAgent.includes('Macintosh') && maxTouchPoints > 1);
};

export const isStandalone = () =>
  matchMedia(STANDALONE).matches || ('standalone' in navigator && navigator.standalone === true);
