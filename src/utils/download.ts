const REVOKE_MS = 1000;

export const downloadFile = (content: string, fileName: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_MS);
};
