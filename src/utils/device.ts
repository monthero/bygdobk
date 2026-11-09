const APPLE_MOBILE = /iPad|iPhone|iPod/;

export const isAppleMobile = () => {
  const { userAgent, maxTouchPoints } = navigator;
  return APPLE_MOBILE.test(userAgent) || (userAgent.includes('Macintosh') && maxTouchPoints > 1);
};
