const LINK_ID = 'variant-fonts';

const HREF =
  'https://fonts.googleapis.com/css2?family=Saira:wght@500..800&family=Barlow+Condensed:wght@500;600;700&family=Familjen+Grotesk:wght@500..700&family=Big+Shoulders+Display:wght@600..800&family=Archivo:wdth,wght@100..125,500..800&family=Unbounded:wght@500..700&family=Sora:wght@500..700&family=Share+Tech+Mono&family=Instrument+Serif:ital@0;1&display=swap';

export const loadVariantFonts = () => {
  if (document.getElementById(LINK_ID)) return;
  document.head.append(Object.assign(document.createElement('link'), { id: LINK_ID, rel: 'stylesheet', href: HREF }));
};
