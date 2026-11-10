import { describe, expect, it } from 'vite-plus/test';

import { fixUp } from './fixups';

describe('fixUp', () => {
  it.each([
    [
      'sv',
      'Utbildningen börjar på tisdag. Läs mer på utbildningssidan.',
      'Träningen börjar på tisdag. Läs mer på träningssidan.',
    ],
    ['sv', 'Nya utbildningstider och utbildningsgrupper', 'Nya träningstider och träningsgrupper'],
    [
      'fi',
      'Koulutus alkaa. Lue lisää koulutussivulta ja koulutuksen ajoista.',
      'Harjoitus alkaa. Lue lisää harjoitussivulta ja harjoituksen ajoista.',
    ],
    ['zh', '培训将于周二开始。更多内容请见培训页面。', '训练将于周二开始。更多内容请见训练页面。'],
  ] as const)('fixes %s sports words', (locale, text, fixed) => {
    expect(fixUp(locale, text)).toBe(fixed);
  });

  it('leaves the words alone inside other words', () => {
    expect(fixUp('sv', 'Hon gick tränarutbildningen.')).toBe('Hon gick tränarutbildningen.');
  });

  it('keeps html tags as they are', () => {
    expect(fixUp('sv', '<div>Läs på <span data-m="lnk1">utbildningssidan</span>.</div>')).toBe(
      '<div>Läs på <span data-m="lnk1">träningssidan</span>.</div>',
    );
  });

  it('does not touch languages without fixes', () => {
    expect(fixUp('da', 'Uddannelsen starter')).toBe('Uddannelsen starter');
  });
});
