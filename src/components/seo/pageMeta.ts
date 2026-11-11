import type { Locale } from '../../i18n/locales.ts';

export const SITE_URL = 'https://bygdobk.vercel.app';
export const SITE_NAME = 'Bygdø Badmintonklubb';

export type PageMeta = { title: string; description: string };

export const PAGE_META = {
  '/': {
    nb: {
      title: 'Bygdø Badmintonklubb - badminton for alle i Oslo',
      description:
        'Badmintonklubb på Bygdøy i Oslo siden 1936. Trening med trener for nybegynnere, barn og junior, spill for voksne og drop-in for medlemmer på Bygdøhus.',
    },
    en: {
      title: 'Bygdø Badmintonklubb - badminton club in Oslo, Norway',
      description:
        'Play badminton in Oslo. A club on Bygdøy since 1936, with coached sessions for beginners, kids and juniors, play for adults and drop-in for members at Bygdøhus.',
    },
    sv: {
      title: 'Bygdø Badmintonklubb - badminton för alla i Oslo',
      description:
        'Badmintonklubb på Bygdøy i Oslo sedan 1936. Träning med tränare för nybörjare, barn och juniorer, spel för vuxna och drop-in för medlemmar i Bygdøhus.',
    },
    da: {
      title: 'Bygdø Badmintonklubb - badminton for alle i Oslo',
      description:
        'Badmintonklub på Bygdøy i Oslo siden 1936. Træning med træner for begyndere, børn og juniorer, spil for voksne og drop-in for medlemmer i Bygdøhus.',
    },
    fi: {
      title: 'Bygdø Badmintonklubb - sulkapalloseura Oslossa',
      description:
        'Sulkapalloseura Bygdøyllä Oslossa vuodesta 1936. Valmennettuja treenejä aloittelijoille, lapsille ja junioreille, peliä aikuisille ja drop-in jäsenille Bygdøhusissa.',
    },
    is: {
      title: 'Bygdø Badmintonklubb - badmintonfélag í Osló',
      description:
        'Badmintonfélag á Bygdøy í Osló síðan 1936. Æfingar með þjálfara fyrir byrjendur, börn og unglinga, spil fyrir fullorðna og drop-in fyrir félaga í Bygdøhus.',
    },
    zh: {
      title: 'Bygdø Badmintonklubb - 奥斯陆羽毛球俱乐部',
      description:
        '自 1936 年起在奥斯陆 Bygdøy 的羽毛球俱乐部。在 Bygdøhus 有教练带的初学者、儿童和青少年训练，成人场次，会员还可以按次来打。',
    },
  },
  '/trening': {
    nb: {
      title: 'Badmintontrening i Oslo - Bygdø Badmintonklubb',
      description:
        'Treningstider på Bygdøhus for nybegynnere, junior og voksne, og fritt spill for medlemmer. Tre kvelder i uka gjennom sesongen.',
    },
    en: {
      title: 'Badminton training in Oslo - Bygdø Badmintonklubb',
      description:
        'Training times at Bygdøhus for beginners, juniors and adults, plus open play for members. Three evenings a week through the season.',
    },
    sv: {
      title: 'Badmintonträning i Oslo - Bygdø Badmintonklubb',
      description:
        'Träningstider i Bygdøhus för nybörjare, juniorer och vuxna, och fritt spel för medlemmar. Tre kvällar i veckan under säsongen.',
    },
    da: {
      title: 'Badmintontræning i Oslo - Bygdø Badmintonklubb',
      description:
        'Træningstider i Bygdøhus for begyndere, juniorer og voksne, og frit spil for medlemmer. Tre aftener om ugen i sæsonen.',
    },
    fi: {
      title: 'Sulkapallotreenit Oslossa - Bygdø Badmintonklubb',
      description:
        'Treeniajat Bygdøhusissa aloittelijoille, junioreille ja aikuisille sekä vapaata peliä jäsenille. Kolmena iltana viikossa kauden aikana.',
    },
    is: {
      title: 'Badmintonæfingar í Osló - Bygdø Badmintonklubb',
      description:
        'Æfingatímar í Bygdøhus fyrir byrjendur, unglinga og fullorðna, og frjálst spil fyrir félaga. Þrjú kvöld í viku á tímabilinu.',
    },
    zh: {
      title: '奥斯陆羽毛球训练 - Bygdø Badmintonklubb',
      description: 'Bygdøhus 的训练时间，适合初学者、青少年和成人，会员还有自由打球时间。赛季期间每周三个晚上。',
    },
  },
  '/arrangementer': {
    nb: {
      title: 'Badmintonturneringer og arrangementer i Oslo - Bygdø Badmintonklubb',
      description:
        'Turneringer på Bygdøhus, turer til turneringer og sosiale kvelder i klubben. Se datoene, meld deg på eller ta en dugnadsvakt.',
    },
    en: {
      title: 'Badminton tournaments and events in Oslo - Bygdø Badmintonklubb',
      description:
        'Tournaments at Bygdøhus, trips to tournaments and social evenings at the club. See the dates, sign up or grab a volunteer shift.',
    },
    sv: {
      title: 'Badmintonturneringar och evenemang i Oslo - Bygdø Badmintonklubb',
      description:
        'Turneringar i Bygdøhus, resor till turneringar och sociala kvällar i klubben. Se datumen, anmäl dig eller ta ett pass som volontär.',
    },
    da: {
      title: 'Badmintonturneringer og arrangementer i Oslo - Bygdø Badmintonklubb',
      description:
        'Turneringer i Bygdøhus, ture til turneringer og sociale aftener i klubben. Se datoerne, tilmeld dig eller tag en frivilligvagt.',
    },
    fi: {
      title: 'Sulkapalloturnaukset ja tapahtumat Oslossa - Bygdø Badmintonklubb',
      description:
        'Turnauksia Bygdøhusissa, matkoja turnauksiin ja seuran yhteisiä iltoja. Katso päivät, ilmoittaudu tai ota talkoovuoro.',
    },
    is: {
      title: 'Badmintonmót og viðburðir í Osló - Bygdø Badmintonklubb',
      description:
        'Mót í Bygdøhus, ferðir á mót og félagskvöld í klúbbnum. Sjáðu dagsetningar, skráðu þig eða taktu sjálfboðavakt.',
    },
    zh: {
      title: '奥斯陆羽毛球比赛和活动 - Bygdø Badmintonklubb',
      description: 'Bygdøhus 的比赛、外出参赛和俱乐部聚会。查看日期、报名或领一个志愿者班次。',
    },
  },
  '/nyheter': {
    nb: {
      title: 'Nyheter - Bygdø Badmintonklubb',
      description: 'Nytt fra klubben: endringer i treningen, turneringer, dugnad og årsmøter.',
    },
    en: {
      title: 'News - Bygdø Badmintonklubb',
      description: 'News from the club: training changes, tournaments, volunteering and annual meetings.',
    },
    sv: {
      title: 'Nyheter - Bygdø Badmintonklubb',
      description: 'Nytt från klubben: ändringar i träningen, turneringar, volontärinsatser och årsmöten.',
    },
    da: {
      title: 'Nyheder - Bygdø Badmintonklubb',
      description: 'Nyt fra klubben: ændringer i træningen, turneringer, frivilligt arbejde og generalforsamlinger.',
    },
    fi: {
      title: 'Uutiset - Bygdø Badmintonklubb',
      description: 'Seuran uutiset: muutokset treeneihin, turnaukset, talkoot ja vuosikokoukset.',
    },
    is: {
      title: 'Fréttir - Bygdø Badmintonklubb',
      description: 'Fréttir frá klúbbnum: breytingar á æfingum, mót, sjálfboðastarf og aðalfundir.',
    },
    zh: {
      title: '新闻 - Bygdø Badmintonklubb',
      description: '俱乐部新闻：训练变动、比赛、志愿活动和年会。',
    },
  },
  '/medlemskap': {
    nb: {
      title: 'Medlemskap og priser - Bygdø Badmintonklubb',
      description:
        'Hva koster det å spille badminton hos oss? Se priser for nybegynnere, junior og voksne, prøvemedlemskap for barn og drop-in.',
    },
    en: {
      title: 'Membership and prices - Bygdø Badmintonklubb',
      description:
        'What does it cost to play badminton with us? Prices for beginners, juniors and adults, a trial membership for kids, and drop-in.',
    },
    sv: {
      title: 'Medlemskap och priser - Bygdø Badmintonklubb',
      description:
        'Vad kostar det att spela badminton hos oss? Priser för nybörjare, juniorer och vuxna, provmedlemskap för barn och drop-in.',
    },
    da: {
      title: 'Medlemskab og priser - Bygdø Badmintonklubb',
      description:
        'Hvad koster det at spille badminton hos os? Priser for begyndere, juniorer og voksne, prøvemedlemskab for børn og drop-in.',
    },
    fi: {
      title: 'Jäsenyys ja hinnat - Bygdø Badmintonklubb',
      description:
        'Mitä sulkapallo meillä maksaa? Hinnat aloittelijoille, junioreille ja aikuisille, kokeilujäsenyys lapsille ja drop-in.',
    },
    is: {
      title: 'Aðild og verð - Bygdø Badmintonklubb',
      description:
        'Hvað kostar að spila badminton hjá okkur? Verð fyrir byrjendur, unglinga og fullorðna, prufuaðild fyrir börn og drop-in.',
    },
    zh: {
      title: '会员和价格 - Bygdø Badmintonklubb',
      description: '在我们这里打羽毛球要多少钱？初学者、青少年和成人的价格，儿童体验会员，以及按次付费。',
    },
  },
  '/medlemskap/bli-medlem': {
    nb: {
      title: 'Bli medlem - Bygdø Badmintonklubb',
      description: 'Velg gruppen som passer deg og send en forespørsel. Styret tar det derfra.',
    },
    en: {
      title: 'Join the club - Bygdø Badmintonklubb',
      description: 'Pick the group that fits you and send a request. The board takes it from there.',
    },
    sv: {
      title: 'Bli medlem - Bygdø Badmintonklubb',
      description: 'Välj gruppen som passar dig och skicka en förfrågan. Styrelsen tar det därifrån.',
    },
    da: {
      title: 'Bliv medlem - Bygdø Badmintonklubb',
      description: 'Vælg den gruppe, der passer dig, og send en forespørgsel. Bestyrelsen tager den derfra.',
    },
    fi: {
      title: 'Liity seuraan - Bygdø Badmintonklubb',
      description: 'Valitse sinulle sopiva ryhmä ja lähetä pyyntö. Hallitus hoitaa loput.',
    },
    is: {
      title: 'Gerast félagi - Bygdø Badmintonklubb',
      description: 'Veldu hópinn sem hentar þér og sendu beiðni. Stjórnin sér um rest.',
    },
    zh: {
      title: '加入俱乐部 - Bygdø Badmintonklubb',
      description: '选好适合你的小组，发送申请，剩下的交给理事会。',
    },
  },
  '/klubben': {
    nb: {
      title: 'Om klubben - Bygdø Badmintonklubb',
      description: 'En av Norges eldste badmintonklubber, stiftet i 1936. Vi spiller på Bygdøhus på Bygdøy i Oslo.',
    },
    en: {
      title: 'About the club - Bygdø Badmintonklubb',
      description: 'One of Norway’s oldest badminton clubs, founded in 1936. We play at Bygdøhus on Bygdøy in Oslo.',
    },
    sv: {
      title: 'Om klubben - Bygdø Badmintonklubb',
      description: 'En av Norges äldsta badmintonklubbar, grundad 1936. Vi spelar i Bygdøhus på Bygdøy i Oslo.',
    },
    da: {
      title: 'Om klubben - Bygdø Badmintonklubb',
      description: 'En af Norges ældste badmintonklubber, grundlagt i 1936. Vi spiller i Bygdøhus på Bygdøy i Oslo.',
    },
    fi: {
      title: 'Tietoa seurasta - Bygdø Badmintonklubb',
      description:
        'Yksi Norjan vanhimmista sulkapalloseuroista, perustettu 1936. Pelaamme Bygdøhusissa Bygdøyllä Oslossa.',
    },
    is: {
      title: 'Um klúbbinn - Bygdø Badmintonklubb',
      description: 'Eitt elsta badmintonfélag Noregs, stofnað 1936. Við spilum í Bygdøhus á Bygdøy í Osló.',
    },
    zh: {
      title: '关于俱乐部 - Bygdø Badmintonklubb',
      description: '挪威历史最悠久的羽毛球俱乐部之一，成立于 1936 年。我们在奥斯陆 Bygdøy 的 Bygdøhus 打球。',
    },
  },
  '/kontakt': {
    nb: {
      title: 'Kontakt oss - Bygdø Badmintonklubb',
      description: 'Spørsmål om trening, medlemskap eller noe annet? Skriv til styret i Bygdø Badmintonklubb.',
    },
    en: {
      title: 'Contact us - Bygdø Badmintonklubb',
      description:
        'A question about training, membership or something else? Write to the board of Bygdø Badmintonklubb.',
    },
    sv: {
      title: 'Kontakta oss - Bygdø Badmintonklubb',
      description: 'Frågor om träning, medlemskap eller något annat? Skriv till styrelsen i Bygdø Badmintonklubb.',
    },
    da: {
      title: 'Kontakt os - Bygdø Badmintonklubb',
      description: 'Spørgsmål om træning, medlemskab eller noget andet? Skriv til bestyrelsen i Bygdø Badmintonklubb.',
    },
    fi: {
      title: 'Ota yhteyttä - Bygdø Badmintonklubb',
      description: 'Kysyttävää treeneistä, jäsenyydestä tai muusta? Kirjoita Bygdø Badmintonklubbin hallitukselle.',
    },
    is: {
      title: 'Hafðu samband - Bygdø Badmintonklubb',
      description: 'Spurning um æfingar, aðild eða eitthvað annað? Skrifaðu stjórn Bygdø Badmintonklubb.',
    },
    zh: {
      title: '联系我们 - Bygdø Badmintonklubb',
      description: '对训练、会员或其他事情有疑问？写信给 Bygdø Badmintonklubb 理事会。',
    },
  },
  '/personvern': {
    nb: {
      title: 'Personvern - Bygdø Badmintonklubb',
      description: 'Hvordan Bygdø Badmintonklubb tar vare på opplysningene dine.',
    },
    en: {
      title: 'Privacy - Bygdø Badmintonklubb',
      description: 'How Bygdø Badmintonklubb looks after your personal data.',
    },
    sv: {
      title: 'Integritet - Bygdø Badmintonklubb',
      description: 'Hur Bygdø Badmintonklubb tar hand om dina personuppgifter.',
    },
    da: {
      title: 'Privatliv - Bygdø Badmintonklubb',
      description: 'Sådan passer Bygdø Badmintonklubb på dine personoplysninger.',
    },
    fi: {
      title: 'Tietosuoja - Bygdø Badmintonklubb',
      description: 'Näin Bygdø Badmintonklubb huolehtii henkilötiedoistasi.',
    },
    is: {
      title: 'Persónuvernd - Bygdø Badmintonklubb',
      description: 'Svona gætir Bygdø Badmintonklubb persónuupplýsinga þinna.',
    },
    zh: {
      title: '隐私 - Bygdø Badmintonklubb',
      description: 'Bygdø Badmintonklubb 如何保护你的个人信息。',
    },
  },
} satisfies Record<string, Record<Locale, PageMeta>>;

export type PagePath = keyof typeof PAGE_META;
