export const percent = (part: number, whole: number) => (whole > 0 ? Math.min(100, (part * 100) / whole) : 0);
