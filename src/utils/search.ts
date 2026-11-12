// Fuse's ignoreDiacritics maps ø and å to o and a but leaves æ alone.
const AE = /[æÆ]/g;

export const AE_CHARS = new Set(['æ', 'Æ']);

export const foldAe = (text: string) => text.replace(AE, 'ae');
