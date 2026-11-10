import { z } from 'zod';

export const GuideLanguage = z.enum(['nb', 'en']);
export type GuideLanguage = z.infer<typeof GuideLanguage>;

export const HelpArea = z.enum(['studio', 'site']);
export type HelpArea = z.infer<typeof HelpArea>;

export const TopicId = z.enum([
  'access',
  'preview',
  'languages',
  'translations',
  'news',
  'training',
  'cancelTraining',
  'events',
  'shifts',
  'siteSettings',
  'club',
  'payment',
  'contactForm',
  'groups',
  'teams',
  'sponsors',
  'photos',
  'plans',
  'board',
  'privacy',
  'images',
  'memberships',
  'newSeason',
  'markPaid',
  'reminders',
  'volunteers',
  'printShifts',
  'boardAccess',
]);
export type TopicId = z.infer<typeof TopicId>;

type TopicText = { title: string; intro: string; steps: readonly string[]; tips: readonly string[] };

export type HelpTopic = { area: HelpArea } & Record<GuideLanguage, TopicText>;

type GuideUi = { title: string; intro: string; topics: string; tip: string; language: string };

export const LANGUAGE_NAMES: Record<GuideLanguage, string> = {
  [GuideLanguage.enum.nb]: 'Norsk',
  [GuideLanguage.enum.en]: 'English',
};

export const HELP_UI: Record<GuideLanguage, GuideUi> = {
  [GuideLanguage.enum.nb]: {
    title: 'Hjelp',
    intro:
      'Korte guider for å holde nettsiden oppdatert. Velg et emne. Knapper og felt i Studio har engelske navn, så dem skriver vi på engelsk.',
    topics: 'Emner',
    tip: 'Tips',
    language: 'Språk',
  },
  [GuideLanguage.enum.en]: {
    title: 'Help',
    intro: 'Short guides for keeping the website up to date. Pick a topic. We use the names you see on the screen.',
    topics: 'Topics',
    tip: 'Tip',
    language: 'Language',
  },
};

export const AREA_TITLES: Record<HelpArea, Record<GuideLanguage, string>> = {
  [HelpArea.enum.studio]: { nb: 'I Studio', en: 'In the Studio' },
  [HelpArea.enum.site]: { nb: 'På nettsiden', en: 'On the website' },
};

export const HELP_TOPICS: Record<TopicId, HelpTopic> = {
  [TopicId.enum.access]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Kom i gang',
      intro: 'Bare administratorer kan redigere nettsiden. Det du endrer, blir et utkast til du publiserer.',
      steps: [
        'Logg inn på nettsiden med kontoen din.',
        'Du må være administrator. Be en annen administrator legge deg til på «Styretilgang» under «Styresider».',
        'Åpne kontomenyen og trykk «Rediger innholdet på nettsiden». Studio åpner seg i en ny fane.',
        'Studio har sin egen innlogging. Den som styrer Sanity, må invitere deg først.',
        'Studio åpner på «Start». Trykk på jobben du vil gjøre, for eksempel «Post news» eller «Cancel training».',
        'Finner du ikke jobben der, åpne «Content» øverst. Velg det du vil endre i listen til venstre. Listen er delt inn i grupper, som «Training», «Events» og «The club».',
        'Alt du skriver, lagres av seg selv som et utkast. Ingen ser det før du trykker «Publish» nederst til høyre.',
      ],
      tips: [
        'Felt med rød feilmelding må fikses før du kan publisere.',
        'Det kan ta noen minutter før endringen vises på nettsiden. Last inn siden på nytt.',
        'Noe finnes bare én av, for eksempel «Notice banner», «Club details», «Payment», «Photos» og «Privacy page». Det gjelder også treningsgruppene og dugnadsteamene. De kan ikke slettes.',
        '«Help» øverst åpner denne guiden.',
        'Den grå linjen øverst i hvert dokument viser hvem som laget det og hvem som publiserte sist («Created by» og «Last published by»). Står det «the board», ble det laget før vi begynte å lagre navn.',
        'Lager du en kopi med «Duplicate», står du som den som laget kopien.',
      ],
    },
    en: {
      title: 'Getting in',
      intro: 'Only admins can edit the website. What you change stays a draft until you publish it.',
      steps: [
        'Log in on the website with your account.',
        'You need to be an admin. Ask another admin to add you on “Board access” under “Board pages”.',
        'Open the account menu and click “Edit site content”. The Studio opens in a new tab.',
        'The Studio has its own login. The person who manages Sanity must invite you first.',
        'The Studio opens on “Start”. Click the job you want to do, for example “Post news” or “Cancel training”.',
        'If the job is not there, open “Content” at the top. Pick what you want to change in the list on the left. The list is split into groups, like “Training”, “Events” and “The club”.',
        'Everything you type is saved as a draft on its own. Nobody sees it until you click “Publish” at the bottom right.',
      ],
      tips: [
        'Fields with a red error must be fixed before you can publish.',
        'It can take a few minutes before the website shows your change. Reload the page.',
        'Some things exist only once, for example “Notice banner”, “Club details”, “Payment”, “Photos” and “Privacy page”. The same goes for the training groups and volunteer teams. They can’t be deleted.',
        '“Help” at the top opens this guide.',
        'The gray line at the top of each document shows who created it and who last published it. “the board” means it was made before names were saved.',
        'If you copy a document with “Duplicate”, you become its creator.',
      ],
    },
  },
  [TopicId.enum.preview]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Forhåndsvisning',
      intro: 'Se endringene dine på de ekte sidene før du publiserer. Bare du ser utkastet.',
      steps: [
        'Trykk «Preview» øverst i Studio, eller «Preview the site» på «Start».',
        'Nettsiden vises til venstre. Klikk deg rundt, eller skriv en adresse i feltet øverst.',
        'Endre en tekst i skjemaet til høyre. Siden oppdateres med en gang.',
        'Hold musen over en tekst på siden og klikk for å åpne feltet den kommer fra.',
        'Ser alt riktig ut? Trykk «Publish». Først da ser besøkende endringen.',
      ],
      tips: [
        'I et dokument viser «Used on … pages» hvilke sider teksten brukes på.',
        'Slå av «Edit» øverst hvis du vil klikke på lenker på siden.',
        'Bytt språk på nettsiden for å se de andre språkene.',
      ],
    },
    en: {
      title: 'Preview',
      intro: 'See your changes on the real pages before you publish. Only you see the draft.',
      steps: [
        'Click “Preview” at the top of the Studio, or “Preview the site” on “Start”.',
        'The website shows on the left. Click around, or type an address in the field at the top.',
        'Change a text in the form on the right. The page updates right away.',
        'Hold the mouse over a text on the page and click to open the field it comes from.',
        'Does it all look right? Click “Publish”. Only then do visitors see the change.',
      ],
      tips: [
        'In a document, “Used on … pages” shows which pages use the text.',
        'Turn off “Edit” at the top if you want to click links on the page.',
        'Switch the language on the website to see the other languages.',
      ],
    },
  },
  [TopicId.enum.languages]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Språk',
      intro: 'Tekstene på nettsiden finnes på flere språk. Norsk og engelsk må alltid fylles ut.',
      steps: [
        'Hvert tekstfelt har «Norsk (bokmål)» og «English» øverst. Begge må fylles ut.',
        'Svensk, dansk, finsk, islandsk og kinesisk ligger under «Translations». Trykk for å åpne.',
        'Disse språkene er valgfrie. Er feltet tomt, viser nettsiden norsk. For kinesisk viser den engelsk.',
        'Hvert språk har sin egen artikkel. Bilder, tabeller og sitater må legges inn i hvert språk for seg.',
      ],
      tips: [
        'Menyer og knapper på nettsiden er oversatt i koden. Dem endrer du ikke her.',
        'Listene i Studio viser den norske tittelen.',
        '«Translations» øverst i Studio viser hvilke tekster som mangler et språk. Se «Manglende oversettelser».',
      ],
    },
    en: {
      title: 'Languages',
      intro: 'The texts on the website come in several languages. Norwegian and English are always required.',
      steps: [
        'Each text field has “Norsk (bokmål)” and “English” at the top. Fill in both.',
        'Swedish, Danish, Finnish, Icelandic and Chinese are under “Translations”. Click to open it.',
        'These languages are optional. When a field is empty, the website shows Norwegian. For Chinese it shows English.',
        'Each language has its own article. Add images, tables and quotes in each language.',
      ],
      tips: [
        'Menus and buttons on the website are translated in the code. You don’t change them here.',
        'The lists in the Studio show the Norwegian title.',
        '“Translations” at the top of the Studio shows which texts are missing a language. See “Missing translations”.',
      ],
    },
  },
  [TopicId.enum.translations]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Manglende oversettelser',
      intro: 'Se hvilke tekster som mangler et språk. Norsk og engelsk må være med. De andre kan stå tomme.',
      steps: [
        'Trykk «Translations» øverst i Studio, eller «Check translations» på «Start».',
        '«Must fix» viser tekster som mangler norsk eller engelsk. Rett disse først.',
        '«Optional» viser tekster som mangler svensk, dansk, finsk, islandsk eller kinesisk. Besøkende ser da norsk i stedet. På kinesisk ser de engelsk.',
        'Trykk «Translate missing» ved en tekst for å la maskinen oversette språkene som mangler, fra norsk (eller engelsk). Eller trykk på teksten og skriv selv.',
        'Åpne teksten og les gjennom oversettelsene. De er maskinoversatt og ligger i et utkast.',
        'Trykk «Publish». Gå tilbake og trykk «Check again» for å oppdatere listen.',
      ],
      tips: [
        'Listen sjekker også utkast. En tekst du har rettet, forsvinner fra listen før du har publisert.',
        '«Translations» inne i et tekstfelt er noe annet. Der skriver du de valgfrie språkene. Se «Språk».',
        '«Translate missing» endrer aldri et språk som allerede har tekst, og publiserer aldri selv.',
        'Står det at det ble for mye på en gang, vent ett minutt og trykk igjen. Det som allerede er oversatt, er lagret.',
      ],
    },
    en: {
      title: 'Missing translations',
      intro: 'See which texts are missing a language. Norwegian and English are required. The others can stay empty.',
      steps: [
        'Click “Translations” at the top of the Studio, or “Check translations” on “Start”.',
        '“Must fix” shows texts that are missing Norwegian or English. Fix these first.',
        '“Optional” shows texts that are missing Swedish, Danish, Finnish, Icelandic or Chinese. Visitors then see Norwegian instead. In Chinese they see English.',
        'Click “Translate missing” next to a text to have the missing languages machine-translated from Norwegian (or English). Or click the text and write them yourself.',
        'Open the text and read through the translations. They are machine-translated and saved as a draft.',
        'Click “Publish”. Go back and click “Check again” to update the list.',
      ],
      tips: [
        'The list checks drafts too. A text you fixed leaves the list before you publish it.',
        '“Translations” inside a text field is something else. That is where you write the optional languages. See “Languages”.',
        '“Translate missing” never changes a language that already has text, and never publishes on its own.',
        'If it says it was too much at once, wait a minute and click again. What was already translated is saved.',
      ],
    },
  },
  [TopicId.enum.news]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Skriv en nyhetssak',
      intro: 'Nyhetssaker vises på forsiden og under Nyheter.',
      steps: [
        'Trykk «Post news» på «Start». Eller åpne «News» i «Content» og trykk «+».',
        'Skriv «Title» og trykk «Generate» ved «URL name». Adressen lages fra den norske tittelen.',
        'Velg «Date» og «Category» («Training», «Event», «Volunteering» eller «Club»). Skriv en kort «Summary» som vises i nyhetslisten.',
        'Skriv selve saken i «Article». Bruk «Heading» for mellomtitler og «Bullets» for punktlister. Fra verktøylinjen kan du sette inn «Callout» (faktaboks), «Quote» (sitat), «Table» (tabell) og bilder.',
        'Vil du ha et eget toppbilde, last det opp i «Banner image». Uten bilde bruker nettsiden et av klubbens bilder, ut fra kategorien.',
        'Handler saken om et arrangement eller en pause? Velg det i «About an event or break». Da viser saken arrangementet med en knapp dit.',
        'Under «Links» kan du legge til knapper. Velg en side under «Page on this site», eller lim inn en lenke under «Or a link to another site». Ikke begge.',
        'Trykk «Publish».',
      ],
      tips: [
        'Når arrangementet eller pausen er over, flytter saken seg fra toppen av nyhetslisten til arkivet.',
        'I en tabell er første rad overskriften.',
        'Den som lager saken, står som forfatter på nettsiden. Er du i styret, vises også bildet og rollen din fra «Board members».',
      ],
    },
    en: {
      title: 'Write a news post',
      intro: 'News posts show on the front page and under News.',
      steps: [
        'Click “Post news” on “Start”. Or open “News” in “Content” and click “+”.',
        'Write the “Title” and click “Generate” next to “URL name”. The address is made from the Norwegian title.',
        'Pick the “Date” and the “Category” (“Training”, “Event”, “Volunteering” or “Club”). Write a short “Summary” for the news list.',
        'Write the post in “Article”. Use “Heading” for headings and “Bullets” for lists. From the toolbar you can add a “Callout” (a highlighted box), a “Quote”, a “Table” and images.',
        'For your own top image, upload it in “Banner image”. Without one, the website uses one of the club’s photos, based on the category.',
        'Is the post about an event or a break? Pick it in “About an event or break”. The post then shows the event with a button to it.',
        'Under “Links” you can add buttons. Pick a page under “Page on this site”, or paste a link under “Or a link to another site”. Not both.',
        'Click “Publish”.',
      ],
      tips: [
        'When the event or break is over, the post moves from the top of the news list to the archive.',
        'In a table, the first row is the header.',
        'The person who creates the post shows as its author on the website. If you are on the board, your photo and role from “Board members” show too.',
      ],
    },
  },
  [TopicId.enum.training]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Treningstider',
      intro:
        'Treningene ligger i «Training times» og gjentas hver uke. Én oppføring gjelder én gruppe på ett klokkeslett.',
      steps: [
        'Trykk «Training times» på «Start», eller åpne «Training times» under «Training» i «Content».',
        'Trykk «+» for en ny trening.',
        'Velg «Training group».',
        'Sett «First day», den første treningsdagen i sesongen.',
        'Under «Repeats every week» velger du ukedagene i «On» og siste dag i «Until».',
        'Sett «Starts at» og «Ends at». Skriv klokkeslett slik: 18:00.',
        'Trykk «Publish». Treningen vises på treningssiden.',
      ],
      tips: [
        'En sesong går fra juli til juni. Treningen hører til sesongen der «First day» er. Nye sesonger dukker opp av seg selv.',
        'Ny sesong? Åpne fjorårets trening, velg «Duplicate» i menyen ved «Publish», og endre datoene.',
        'Trener samme gruppe på et annet klokkeslett, trenger det en egen oppføring.',
        'Trener gruppen i en annen hall, fyll ut «Venue». Tomt betyr hjemmehallen.',
      ],
    },
    en: {
      title: 'Training times',
      intro: 'Trainings are in “Training times” and repeat every week. One entry is for one group at one time.',
      steps: [
        'Click “Training times” on “Start”, or open “Training times” under “Training” in “Content”.',
        'Click “+” for a new training.',
        'Pick the “Training group”.',
        'Set “First day”, the first training day of the season.',
        'Under “Repeats every week”, pick the weekdays in “On” and the last day in “Until”.',
        'Set “Starts at” and “Ends at”. Write times like this: 18:00.',
        'Click “Publish”. The training shows on the training page.',
      ],
      tips: [
        'A season runs from July to June. The training belongs to the season of its “First day”. New seasons show up on their own.',
        'New season? Open last season’s training, pick “Duplicate” in the menu next to “Publish”, then change the dates.',
        'If the same group trains at another time, that needs its own entry.',
        'If the group trains in another hall, fill in the “Venue”. Empty means the home hall.',
      ],
    },
  },
  [TopicId.enum.cancelTraining]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Avlys trening',
      intro: 'Du avlyser trening med en pause. Den passer for ferier og for én avlyst kveld.',
      steps: [
        'Trykk «Cancel training» på «Start». Eller åpne «Breaks and canceled training» i «Content» og trykk «+».',
        'Skriv en «Title», for eksempel «Høstferie». Den vises på treningssiden som grunnen.',
        'Sett «First day». Varer pausen flere dager, sett også «Last day».',
        'La «Starts at» og «Ends at» stå tomme for å dekke hele dager. Fyll dem ut hvis bare en del av dagen er avlyst.',
        'Under «Only for these groups» velger du gruppene som får fri. Tomt betyr alle grupper.',
        'Trykk «Publish». Treningene vises som avlyst, og pausen står under «Pauser denne sesongen».',
      ],
      tips: [
        'Turneringer, sosiale kvelder, møter og turer virker på samme måte. Overlapper de en trening, og gruppen passer, blir treningen avlyst.',
        'Et arrangement uten klokkeslett dekker hele dagen. Skal treningen gå som vanlig, velg grupper eller sett klokkeslett.',
        'Er «The date is set» slått av, avlyser arrangementet ingenting.',
      ],
    },
    en: {
      title: 'Cancel a training',
      intro: 'You cancel training with a break. Use it for holidays and for a single canceled evening.',
      steps: [
        'Click “Cancel training” on “Start”. Or open “Breaks and canceled training” in “Content” and click “+”.',
        'Write a “Title”, for example “Fall break”. The training page shows it as the reason.',
        'Set “First day”. If the break is longer, also set “Last day”.',
        'Leave “Starts at” and “Ends at” empty to cover whole days. Fill them in if only part of the day is off.',
        'Under “Only for these groups”, pick the groups that have no training. Empty means all groups.',
        'Click “Publish”. The trainings show as canceled, and the break is listed under “Breaks this season”.',
      ],
      tips: [
        'Tournaments, socials, meetings and trips work the same way. If one overlaps a training and the group matches, that training is canceled.',
        'An event without times covers the whole day. To keep training on, pick groups or set times.',
        'When “The date is set” is off, the event cancels nothing.',
      ],
    },
  },
  [TopicId.enum.events]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Arrangementer',
      intro:
        'Turneringer, sosiale kvelder, møter og turer ligger i «Events». Hvert arrangement får sin egen side.',
      steps: [
        'Trykk «Add an event» på «Start». Eller åpne «Events» i «Content», trykk «+» og velg «Tournament», «Social», «Meeting» eller «Trip».',
        'Skjemaet har faner: «About», «Date and time», «Place» og «Sign-up». «All fields» viser alt på én gang.',
        'I «About» sjekker du at «Type» stemmer. Skriv «Title» og «Description», og trykk «Generate» ved «URL name».',
        '«Tip box» i «About» viser en liten tipsboks på arrangementssiden.',
        'I «Date and time» setter du «First day», og «Last day» hvis det varer flere dager. «Starts at» og «Ends at» er valgfrie.',
        'Er datoen ikke bestemt? Slå av «The date is set» og skriv omtrent når under «When, in words», for eksempel «Våren 2027». Datoen brukes da bare til sortering.',
        'I «Place» fyller du ut «Venue» hvis det ikke er i hjemmehallen. Tomt betyr hallen fra «Club details». En tur må alltid ha en «Venue». Uten «Map link» åpner siden adressen i kartappen.',
        'Har arrangementet påmelding, fyll ut «Registration link» og «Registration deadline» i «Sign-up».',
        'Trykk «Publish».',
      ],
      tips: [
        'Listen viser de nyeste først. Når arrangementet er over, står det «Done» først i linjen under navnet.',
        'De siste tre dagene før fristen viser siden «Stenger snart». Etter fristen er påmeldingen stengt.',
        'Arrangementer med fast dato kommer med i kalenderen folk abonnerer på med «Abonner» på Arrangementer-siden. Treningene har egne kalendere per gruppe: «Legg til i kalenderen» på Trening-siden. Avlyste treninger blir markert der av seg selv.',
        'Et arrangement på samme tid som trening avlyser treningen. Se «Avlys trening».',
        'Vil du ha et eget bilde for arrangementet, last det opp i «Banner image» under «About». Bildet vises øverst på arrangementssiden og som lite bilde på forsiden. Uten bilde brukes standardbildet for arrangementer.',
      ],
    },
    en: {
      title: 'Events',
      intro:
        'Tournaments, socials, meetings and trips are in “Events”. Each event gets its own page.',
      steps: [
        'Click “Add an event” on “Start”. Or open “Events” in “Content”, click “+” and pick “Tournament”, “Social”, “Meeting” or “Trip”.',
        'The form has tabs: “About”, “Date and time”, “Place” and “Sign-up”. “All fields” shows everything at once.',
        'In “About”, check that the “Type” is right. Write the “Title” and “Description”, and click “Generate” next to “URL name”.',
        '“Tip box” in “About” shows a small tip on the event page.',
        'In “Date and time”, set “First day”, and “Last day” if it lasts more than one day. “Starts at” and “Ends at” are optional.',
        'Date not decided yet? Turn off “The date is set” and write roughly when under “When, in words”, for example “Spring 2027”. The date is then only used to sort.',
        'In “Place”, fill in the “Venue” if it is not in the home hall. Empty means the hall from “Club details”. A trip always needs a “Venue”. Without a “Map link”, the site opens the address in the map app.',
        'If people must sign up, fill in “Registration link” and “Registration deadline” in “Sign-up”.',
        'Click “Publish”.',
      ],
      tips: [
        'The list shows the newest first. When the event is over, “Done” shows first in the line under its name.',
        'In the last three days before the deadline, the website shows “Closing soon”. After the deadline, sign-up is closed.',
        'Events with a set date are in the calendar feed people get with “Subscribe” on the Events page. Training has its own calendar per group: “Add to calendar” on the Training page. Canceled sessions are marked there by themselves.',
        'An event at the same time as a training cancels that training. See “Cancel a training”.',
        'For the event’s own photo, upload it in “Banner image” under “About”. It shows at the top of the event page and as a small picture on the front page. Without one, the site uses the default events photo.',
      ],
    },
  },
  [TopicId.enum.shifts]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Dugnadsvakter',
      intro: 'Klubbens egne turneringer og sosiale kvelder kan ha dugnadsvakter som medlemmene melder seg på.',
      steps: [
        'Åpne arrangementet under «Events». «Type» må være «Tournament» eller «Social».',
        'Slå på «Organized by the club» i fanen «About».',
        'Da dukker fanen «Volunteers» opp. Under «Volunteer shifts» legger du til én vakt per lag og tidsrom.',
        'Velg «Team» («Hall», «Kiosk» eller «Secretariat»), «Day», «Start», «End» og «People needed». Kryss av «Setup or teardown» for rigging og rydding.',
        'Trykk «Publish». På arrangementssiden kan innloggede medlemmer velge en ledig vakt og trykke «Meld deg på».',
        'Bruker dere også et regneark, lim inn lenken i «Extra sign-up link». Siden viser da en knapp til arket.',
      ],
      tips: [
        'Ikke slett en vakt som folk har meldt seg på. De havner under «På en vakt som er fjernet» på dugnadssiden.',
        'Se hvem som står på vaktene i «Dugnadsoversikt».',
      ],
    },
    en: {
      title: 'Volunteer shifts',
      intro: 'The club’s own tournaments and socials can have volunteer shifts that members sign up for.',
      steps: [
        'Open the event under “Events”. “Type” must be “Tournament” or “Social”.',
        'Turn on “Organized by the club” in the “About” tab.',
        'The “Volunteers” tab then shows up. Under “Volunteer shifts”, add one shift per team and time slot.',
        'Pick the “Team” (“Hall”, “Kiosk” or “Secretariat”), “Day”, “Start”, “End” and “People needed”. Check “Setup or teardown” for setting up and tidying up.',
        'Click “Publish”. On the event page, logged-in members pick a free shift and click “Sign up”.',
        'If you also use a spreadsheet, paste its link in “Extra sign-up link”. The website then shows a button to it.',
      ],
      tips: [
        'Don’t delete a shift people signed up for. They end up under “On a shift that’s gone” on the volunteers screen.',
        'See who is on each shift in “Volunteers screen”.',
      ],
    },
  },
  [TopicId.enum.siteSettings]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Melding og sosiale medier',
      intro:
        'Meldingen øverst på alle sider ligger i «Notice banner». Lenkene til sosiale medier ligger i «Social links». Begge finner du under «Every page» i «Content».',
      steps: [
        'Trykk «Show a notice» på «Start», eller åpne «Notice banner» i «Content».',
        'Skriv «Text» og slå på «Show the notice».',
        'Velg «Tone»: «Info» for vanlige beskjeder, «Warning» for viktige. Den viktige meldingen er gul.',
        'Trykk «Publish».',
        'For sosiale medier åpner du «Social links». Under «Links» legger du til én lenke per plattform. Velg «Platform» og lim inn «Link». Lenken må starte med https://.',
        'Dra lenkene i den rekkefølgen du vil ha. Slik vises de i bunnen av siden, i menyen og på kontaktsiden.',
        'Trykk «Publish».',
      ],
      tips: ['Slå av «Show the notice» når meldingen er utdatert. Teksten blir liggende til neste gang.'],
    },
    en: {
      title: 'Notice and social links',
      intro:
        'The notice at the top of every page is in “Notice banner”. The links to social media are in “Social links”. You find both under “Every page” in “Content”.',
      steps: [
        'Click “Show a notice” on “Start”, or open “Notice banner” in “Content”.',
        'Write the “Text” and turn on “Show the notice”.',
        'Pick the “Tone”: “Info” for normal news, “Warning” for important news. The important one is yellow.',
        'Click “Publish”.',
        'For social media, open “Social links”. Under “Links”, add one link per platform. Pick the “Platform” and paste the “Link”. It must start with https://.',
        'Drag the links into the order you want. That is the order in the footer, the menu and on the contact page.',
        'Click “Publish”.',
      ],
      tips: ['Turn off “Show the notice” when it is out of date. The text stays for next time.'],
    },
  },
  [TopicId.enum.plans]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Medlemskap og priser',
      intro:
        'Prisene på «Medlemskap og priser» kommer fra «Prices and plans». Rabattene kommer fra «Discounts». Begge ligger under «Membership» i «Content».',
      steps: [
        'Trykk «Prices and plans» på «Start», eller åpne «Prices and plans» i «Content».',
        'Velg en du vil endre, eller trykk «+» for en ny.',
        'Skriv «Name» og «Who it is for», og trykk «Generate» ved «URL name».',
        'Velg «Type». For «Season (membership and training)» velger du også «Training group».',
        'Velg «Who can pick it»: «Adults», «Children» eller «Everyone». Det styrer hva som vises når noen melder inn seg selv eller et barn.',
        'Fyll ut «Membership fee (NOK)» og «Training fee (NOK)». Nettsiden viser summen som total. Med «Price per visit (NOK)» vises pris per gang i stedet.',
        '«Order» bestemmer rekkefølgen. Lavest tall kommer først.',
        'Trykk «Publish».',
        'For rabatter: åpne «Discounts», trykk «+» og skriv «Title» og «Text». De vises under «Rabatter og hjelp».',
      ],
      tips: [
        'Prisen lagres i forespørselen når noen melder seg inn. Endrer du prisen senere, gjelder det bare nye forespørsler.',
        'For «Drop-in (pay per visit)» viser siden Vipps-nummeret i stedet for en total.',
      ],
    },
    en: {
      title: 'Membership and prices',
      intro:
        'The prices on “Membership and prices” come from “Prices and plans”. The discounts come from “Discounts”. Both are under “Membership” in “Content”.',
      steps: [
        'Click “Prices and plans” on “Start”, or open “Prices and plans” in “Content”.',
        'Pick one to change, or click “+” for a new one.',
        'Write the “Name” and “Who it is for”, and click “Generate” next to “URL name”.',
        'Pick the “Type”. For “Season (membership and training)”, also pick the “Training group”.',
        'Pick “Who can pick it”: “Adults”, “Children” or “Everyone”. This decides what shows when someone signs up themselves or a child.',
        'Fill in “Membership fee (NOK)” and “Training fee (NOK)”. The website shows the sum as the total. With “Price per visit (NOK)”, it shows a price per visit instead.',
        '“Order” sets the order. The lowest number comes first.',
        'Click “Publish”.',
        'For discounts: open “Discounts”, click “+” and write the “Title” and “Text”. They show under “Discounts and help”.',
      ],
      tips: [
        'The price is saved in the request when someone joins. If you change the price later, only new requests get it.',
        'For “Drop-in (pay per visit)”, the website shows the Vipps number instead of a total.',
      ],
    },
  },
  [TopicId.enum.board]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Styret',
      intro: 'Styremedlemmene vises på klubbsiden med bilde, e-post og telefon.',
      steps: [
        'Trykk «Board members» på «Start», eller åpne «Board members» under «The club» i «Content».',
        'Trykk «+» for en ny.',
        'Skriv «Name» og «Role on the board».',
        'Last opp «Photo». Bildet vises som et kvadrat, så sett hotspot på ansiktet. Se «Bilder».',
        'Fyll ut «Email» og «Phone». Telefon er 8 sifre uten mellomrom.',
        '«Order» bestemmer rekkefølgen. Lavest tall kommer først.',
        'Trykk «Publish».',
      ],
      tips: ['Går noen ut av styret? Åpne personen og velg «Delete» i menyen ved «Publish».'],
    },
    en: {
      title: 'The board',
      intro: 'Board members show on the club page with photo, email and phone.',
      steps: [
        'Click “Board members” on “Start”, or open “Board members” under “The club” in “Content”.',
        'Click “+” for a new one.',
        'Write the “Name” and “Role on the board”.',
        'Upload the “Photo”. It shows as a square, so put the hotspot on the face. See “Images”.',
        'Fill in “Email” and “Phone”. The phone number is 8 digits with no spaces.',
        '“Order” sets the order. The lowest number comes first.',
        'Click “Publish”.',
        'Bruk samme e-post som du logger inn i Studio med. Da vises du som forfatter med bilde og rolle. To personer kan ikke ha samme e-post.',
      ],
      tips: ['Someone left the board? Open the person and pick “Delete” in the menu next to “Publish”.'],
    },
  },
  [TopicId.enum.privacy]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Personvern',
      intro: 'Teksten på personvernsiden endrer du i «Privacy page».',
      steps: [
        'Åpne «Privacy page» under «The club» i «Content».',
        'Endre «Title» og «Text» på norsk og engelsk.',
        'Sett «Last updated» til datoen for endringen.',
        'Trykk «Publish».',
        'Use the same email you log in to the Studio with. Then you show as the author with your photo and role. Two people can’t have the same email.',
      ],
      tips: ['Siden finnes bare én gang, så den kan ikke slettes.'],
    },
    en: {
      title: 'Privacy',
      intro: 'You change the text on the privacy page in “Privacy page”.',
      steps: [
        'Open “Privacy page” under “The club” in “Content”.',
        'Change the “Title” and “Text” in Norwegian and English.',
        'Set “Last updated” to the date of the change.',
        'Click “Publish”.',
      ],
      tips: ['There is only one privacy page, so it can’t be deleted.'],
    },
  },
  [TopicId.enum.club]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Klubbinfo',
      intro:
        'E-post, hallen, organisasjonsnummer og varslingslenke. Vises i bunnen av siden, i menyen, på kontaktsiden og på trening og arrangementer.',
      steps: [
        'Åpne «Club details» under «The club» i «Content».',
        '«Board email» er e-posten som vises på siden. Den får også meldinger fra kontaktskjemaet, hvis ikke et tema sier noe annet.',
        'Under «Home hall» fyller du ut «Name» og «Address». Trening og arrangementer uten egen «Venue» holdes her.',
        '«Map link» er valgfri. Uten den åpner siden adressen i kartappen til den som besøker.',
        '«Organization number» skriver du slik: 993 621 358.',
        '«Whistleblowing link» vises på klubbsiden, der medlemmer kan varsle utenfor klubben.',
        'Trykk «Publish».',
      ],
      tips: ['Tomme felt skjules på siden.'],
    },
    en: {
      title: 'Club details',
      intro:
        'Email, the hall, organization number and whistleblowing link. Shown in the footer, the menu, on the contact page and on training and events.',
      steps: [
        'Open “Club details” under “The club” in “Content”.',
        '“Board email” is the email shown on the site. It also gets contact form messages, unless a topic says otherwise.',
        'Under “Home hall”, fill in the “Name” and “Address”. Training and events without their own “Venue” are held here.',
        '“Map link” is optional. Without it, the site opens the address in the visitor’s map app.',
        'Write the “Organization number” like this: 993 621 358.',
        '“Whistleblowing link” shows on the club page, where members can report problems outside the club.',
        'Click “Publish”.',
      ],
      tips: ['Empty fields are hidden on the site.'],
    },
  },
  [TopicId.enum.payment]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Betaling',
      intro: 'Vipps-nummer, kontonummer og teksten om hvordan man betaler.',
      steps: [
        'Trykk «Payment» på «Start», eller åpne «Payment» under «Membership» i «Content».',
        '«Vipps number» vises ved drop-in-prisen og på forsiden. La den stå tom for å skjule den.',
        '«Bank account number» er valgfritt. Det vises i steget «Pay» på medlemskapssiden.',
        '«How to pay» er teksten i steget «Pay». Skriv den på norsk og engelsk.',
        'Trykk «Publish».',
      ],
      tips: [],
    },
    en: {
      title: 'Payment',
      intro: 'The Vipps number, the account number and the text on how to pay.',
      steps: [
        'Click “Payment” on “Start”, or open “Payment” under “Membership” in “Content”.',
        '“Vipps number” shows next to the drop-in price and on the front page. Leave it empty to hide it.',
        '“Bank account number” is optional. It shows in the “Pay” step on the membership page.',
        '“How to pay” is the text in the “Pay” step. Write it in Norwegian and English.',
        'Click “Publish”.',
      ],
      tips: [],
    },
  },
  [TopicId.enum.contactForm]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Kontaktskjema',
      intro: 'Temaene besøkende velger på kontaktsiden, og hvem som får meldingene.',
      steps: [
        'Åpne «Contact form» under «The club» i «Content».',
        'Under «Topics» har hvert tema en «Label» (det besøkende ser), «Send to» og en «ID».',
        'Under «Send to» legger du til én eller flere e-poster. Tomt betyr styrets e-post.',
        'Dra temaene i den rekkefølgen du vil ha. Det første er valgt fra start.',
        'Trykk «Publish».',
      ],
      tips: [
        'Knapper på siden åpner skjemaet med et tema valgt: training, membership, tournaments, sponsor og other. Behold disse ID-ene. Mangler en, åpner knappen det første temaet.',
        'Nye temaer får en egen ID med små bokstaver, for eksempel «kiosk».',
      ],
    },
    en: {
      title: 'Contact form',
      intro: 'The topics visitors pick on the contact page, and who gets the messages.',
      steps: [
        'Open “Contact form” under “The club” in “Content”.',
        'Under “Topics”, each topic has a “Label” (what visitors see), “Send to” and an “ID”.',
        'Under “Send to”, add one or more emails. Empty means the board email.',
        'Drag the topics into the order you want. The first one is picked at the start.',
        'Click “Publish”.',
      ],
      tips: [
        'Buttons on the site open the form with a topic picked: training, membership, tournaments, sponsor and other. Keep these IDs. If one is missing, the button opens the first topic.',
        'New topics get their own lowercase ID, for example “kiosk”.',
      ],
    },
  },
  [TopicId.enum.groups]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Treningsgrupper',
      intro: 'Navn, tekst og om gruppen tar inn nye spillere. De fire gruppene er faste.',
      steps: [
        'Trykk «Training groups» på «Start», eller åpne «Training groups» under «Training» i «Content».',
        'Velg en gruppe.',
        'Endre «Name» og «Who it is for». Teksten vises på treningssiden.',
        'Slå på «With a coach» hvis gruppen har trener.',
        'Under «New members» velger du «Open for new members», «Waiting list» eller «Full, no new members».',
        'Med venteliste eller full kan du skrive en «Note about new members», for eksempel «Vi tar inn nye i januar.»',
        'Trykk «Publish».',
      ],
      tips: [
        'Er gruppen full, kan ingen velge den på innmeldingssiden. Treningssiden viser «Spør om plass» i stedet.',
        'Med venteliste kan folk fortsatt sende forespørsel. De får vite at gruppen har venteliste.',
      ],
    },
    en: {
      title: 'Training groups',
      intro: 'The name, the text and whether the group takes new players. The four groups are fixed.',
      steps: [
        'Click “Training groups” on “Start”, or open “Training groups” under “Training” in “Content”.',
        'Pick a group.',
        'Change “Name” and “Who it is for”. The text shows on the training page.',
        'Turn on “With a coach” if the group has a coach.',
        'Under “New members”, pick “Open for new members”, “Waiting list” or “Full, no new members”.',
        'With a waiting list or full, you can write a “Note about new members”, for example “We take new players in January.”',
        'Click “Publish”.',
      ],
      tips: [
        'When a group is full, nobody can pick it on the join page. The training page shows “Ask about a spot” instead.',
        'With a waiting list, people can still send a request. They are told the group has a waiting list.',
      ],
    },
  },
  [TopicId.enum.teams]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Dugnadsteam',
      intro: 'Navn og tekst for teamene Hall, Kiosk og Sekretariat. Vises når medlemmer melder seg på vakter.',
      steps: [
        'Åpne «Volunteer teams» under «Events» i «Content» og velg et team.',
        'Endre «Name» og «What the team does».',
        'Trykk «Publish».',
      ],
      tips: ['Teamene er faste. Selve vaktene lager du på arrangementet. Se «Dugnadsvakter».'],
    },
    en: {
      title: 'Volunteer teams',
      intro: 'The name and text of the Hall, Kiosk and Secretariat teams. Shown when members sign up for shifts.',
      steps: [
        'Open “Volunteer teams” under “Events” in “Content” and pick a team.',
        'Change “Name” and “What the team does”.',
        'Click “Publish”.',
      ],
      tips: ['The teams are fixed. You make the shifts on the event. See “Volunteer shifts”.'],
    },
  },
  [TopicId.enum.sponsors]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Sponsorer og medlemsfordeler',
      intro: 'Sponsorer vises i stripen over bunnen av siden. En medlemsfordel vises på medlemskapssiden.',
      steps: [
        'Trykk «Sponsors» på «Start», eller åpne «Sponsors» under «Every page» i «Content».',
        'Trykk «+» for en ny, eller velg en som finnes.',
        'I fanen «Basics» fyller du ut «Name», «Logo» og «Website». En bred logo med gjennomsiktig bakgrunn ser best ut.',
        'Sett «Order» i «Basics» for rekkefølgen. Lavere kommer først.',
        'I fanen «Partner strip» slår du på «Show in the partner strip» og skriver «Text in the partner strip».',
        'Har sponsoren en medlemsfordel, åpne fanen «Member deal». Fyll ut «Intro», opptil fire «Perks» med ikon, stor og liten tekst, og «How to use it».',
        'Slå på «Show an "Ask for the code" button» hvis medlemmer trenger en kode fra styret.',
        'Trykk «Publish».',
      ],
      tips: ['Uten medlemsfordeler skjules hele delen på medlemskapssiden.'],
    },
    en: {
      title: 'Sponsors and member deals',
      intro: 'Sponsors show in the strip above the footer. A member deal shows on the membership page.',
      steps: [
        'Click “Sponsors” on “Start”, or open “Sponsors” under “Every page” in “Content”.',
        'Click “+” for a new one, or pick one that exists.',
        'In the “Basics” tab, fill in “Name”, “Logo” and “Website”. A wide logo with a see-through background looks best.',
        'Set “Order” in “Basics” for the order. Lower comes first.',
        'In the “Partner strip” tab, turn on “Show in the partner strip” and write the “Text in the partner strip”.',
        'If the sponsor has a member deal, open the “Member deal” tab. Fill in the “Intro”, up to four “Perks” with an icon, big and small text, and “How to use it”.',
        'Turn on “Show an "Ask for the code" button” if members need a code from the board.',
        'Click “Publish”.',
      ],
      tips: ['Without member deals, that whole part of the membership page is hidden.'],
    },
  },
  [TopicId.enum.photos]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Sidebilder',
      intro: 'Bildene øverst på hver side, på forsidekortene, på nyheter uten toppbilde og på styresidene.',
      steps: [
        'Trykk «Photos» på «Start», eller åpne «Photos» under «Every page» i «Content».',
        'Velg fanen «Pages», «Front page», «News without a banner» eller «Board pages».',
        'Last opp et bilde i feltet og fyll ut «Describe the image».',
        'Sett hotspot på det viktigste i bildet. Se «Bilder».',
        'Trykk «Publish».',
      ],
      tips: [
        'Et tomt felt bruker bildet som vises i den lille forhåndsvisningen under feltet.',
        'Fjern bildet for å gå tilbake til standardbildet.',
      ],
    },
    en: {
      title: 'Page photos',
      intro:
        'The photos at the top of each page, on the front page cards, on news without a banner and on the board pages.',
      steps: [
        'Click “Photos” on “Start”, or open “Photos” under “Every page” in “Content”.',
        'Pick the “Pages”, “Front page”, “News without a banner” or “Board pages” tab.',
        'Upload a photo in the field and fill in “Describe the image”.',
        'Put the hotspot on the most important part. See “Images”.',
        'Click “Publish”.',
      ],
      tips: [
        'An empty field uses the photo in the small preview under it.',
        'Remove the photo to go back to the default one.',
      ],
    },
  },
  [TopicId.enum.images]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Bilder',
      intro: 'Bilder lastes opp rett i feltet der de skal brukes.',
      steps: [
        'Trykk «Upload» i bildefeltet, eller dra en fil inn. Med «Select» bruker du et bilde som allerede er lastet opp.',
        'Fyll ut «Describe the image». Skriv kort hva bildet viser, for dem som ikke kan se det. For toppbildet i en nyhetssak må det fylles ut.',
        'Trykk på beskjær-knappen på bildet. Der velger du utsnitt (crop) og hotspot, det viktigste i bildet. Nettsiden holder hotspot synlig når bildet kuttes.',
        'For «Banner image» viser Studio hvordan bildet blir øverst i saken og på nyhetskortet.',
      ],
      tips: [
        'Bruk brede bilder som toppbilde. Plakater og andre bilder legger du inn i selve artikkelen.',
        'Styrebilder vises som kvadrat. Sett hotspot på ansiktet.',
      ],
    },
    en: {
      title: 'Images',
      intro: 'You upload images right in the field where they are used.',
      steps: [
        'Click “Upload” in the image field, or drag a file in. With “Select” you use an image that is already uploaded.',
        'Fill in “Describe the image”. Say in a few words what the image shows, for people who can’t see it. For the banner of a news post, it is required.',
        'Click the crop button on the image. There you pick the crop and the hotspot, the most important part. The website keeps the hotspot in view when it cuts the image.',
        'For “Banner image”, the Studio shows how it looks at the top of the post and on the news card.',
      ],
      tips: [
        'Use wide photos as banners. Posters and other images go in the article itself.',
        'Board photos show as a square. Put the hotspot on the face.',
      ],
    },
  },
  [TopicId.enum.memberships]: {
    area: HelpArea.enum.site,
    nb: {
      title: 'Medlemskap og betaling',
      intro:
        'Medlemmer og betaling styrer du på nettsiden, ikke i Studio. Åpne kontomenyen og trykk «Styresider». Da kommer du rett til «Medlemskap».',
      steps: [
        'Når noen melder seg inn på «Bli medlem», havner forespørselen under «Forespørsler».',
        'Trykk «Godkjenn» for å gjøre personen til medlem, eller «Avslå». Avslåtte finner du med «Vis avslåtte». Der kan du trykke «Angre avslag».',
        'Under «Medlemmer» ser du alle med konto, og alle som har et medlemskap. Velg sesong øverst. Med «Alle», «Betalt», «Ubetalt», «Venter» og «Uten medlemskap» ser du bare dem du trenger.',
        'Trykk på en person for å se medlemskapene deres, også barnas. Har noen konto, men ikke medlemskap, trykker du «Legg til». E-posten er allerede fylt ut.',
        'Når noen har betalt, trykk «Marker som betalt». Velg «Betalt dato» og «Betalt med», for eksempel Vipps eller bankoverføring. Har mange betalt? Se «Marker mange som betalt».',
        'Med «Legg til medlemskap» legger du inn noen selv, for eksempel et barn uten konto. Blyanten endrer, søppelbøtta sletter.',
        '«Oversikt» viser antall medlemmer, hvor mange som har betalt, og hvor mye som er innbetalt per type. «Vis hvem» viser dem som ikke har betalt.',
        '«Last ned regneark» lagrer medlemmene i sesongen som en fil du kan åpne i Excel.',
      ],
      tips: [
        'Et blått tall på profilbildet ditt viser hvor mange forespørsler som venter. Samme tall står på «Styresider» og på «Medlemskap».',
        'Linjen øverst på alle styresidene bytter mellom «Medlemskap», «Frivillige» og «Styretilgang».',
        'Søk på navn eller e-post for å finne noen raskt.',
        'Åpne en person for å se hvem som la til, godkjente, markerte som betalt og sist endret hvert medlemskap. Merket «Styret» betyr at e-posten til personen står i «Board members» i Studio. Står det «styret» uten navn, skjedde det før vi begynte å lagre navn.',
      ],
    },
    en: {
      title: 'Members and payments',
      intro:
        'You handle members and payments on the website, not in the Studio. Open the account menu and click “Board pages”. It opens “Memberships”.',
      steps: [
        'When someone joins on “Join the club”, the request shows under “Requests”.',
        'Click “Approve” to make them a member, or “Decline”. Find declined ones with “Show declined”. There you can click “Undo decline”.',
        'Under “Members” you see everyone with an account, and everyone with a membership. Pick the season at the top. Use “All”, “Paid”, “Unpaid”, “Requested” and “No membership” to show only the people you need.',
        'Click a person to see their memberships, including their children’s. If someone has an account but no membership, click “Add”. Their email is already filled in.',
        'When someone has paid, click “Mark as paid”. Pick “Paid on” and “Paid with”, for example Vipps or bank transfer. Many people paid? See “Mark many as paid”.',
        'With “Add membership” you add someone yourself, for example a child without an account. The pencil edits, the trash can deletes.',
        '“Overview” shows how many members there are, how many have paid, and how much came in per plan. “Show who” lists the ones who have not paid.',
        '“Download spreadsheet” saves the season’s members as a file you can open in Excel.',
      ],
      tips: [
        'A blue number on your profile picture shows how many requests are waiting. The same number shows on “Board pages” and on “Memberships”.',
        'The bar at the top of every board page switches between “Memberships”, “Volunteers” and “Board access”.',
        'Search by name or email to find someone fast.',
        'Open a person to see who added, approved, marked as paid and last changed each membership. The “Board” tag means the person’s email is in “Board members” in the Studio. “the board” without a name means it happened before names were saved.',
      ],
    },
  },
  [TopicId.enum.newSeason]: {
    area: HelpArea.enum.site,
    nb: {
      title: 'Start en ny sesong',
      intro: 'Kopier medlemmene fra forrige sesong, så slipper du å legge inn alle på nytt.',
      steps: [
        'Gå til «Medlemskap» og velg den nye sesongen i «Sesong» øverst.',
        'Trykk pilen ved «Legg til medlemskap» og velg «Kopier medlemmer fra …». Er sesongen tom, finner du samme knapp under fanene.',
        'Sjekk tallene: hvor mange som blir lagt til, og hvem som allerede er med.',
        'Trykk «Kopier … medlemskap».',
      ],
      tips: [
        'Alle starter som ikke betalt, til dagens priser.',
        'Drop-in og prøvemedlemskap blir ikke kopiert.',
        'Har noen allerede samme medlemskap i den nye sesongen, hoppes de over.',
      ],
    },
    en: {
      title: 'Start a new season',
      intro: 'Copy the members from last season, so you don’t have to add everyone again.',
      steps: [
        'Go to “Memberships” and pick the new season in “Season” at the top.',
        'Click the arrow next to “Add membership” and pick “Copy members from …”. If the season is empty, the same button is under the tabs.',
        'Check the numbers: how many will be added, and who is already in.',
        'Click “Copy … memberships”.',
      ],
      tips: [
        'Everyone starts as not paid, at today’s prices.',
        'Drop-ins and trials are not copied.',
        'If someone already has the same plan in the new season, they are skipped.',
      ],
    },
  },
  [TopicId.enum.markPaid]: {
    area: HelpArea.enum.site,
    nb: {
      title: 'Marker mange som betalt',
      intro: 'Har mange betalt, kan du markere dem på én gang.',
      steps: [
        'Gå til fanen «Medlemmer» på «Medlemskap». Velg «Ubetalt» for å se bare dem som ikke har betalt.',
        'Kryss av ved dem som har betalt, eller kryss av «Velg alle … ubetalte» øverst.',
        'Trykk «Marker … som betalt» i linjen nederst.',
        'Velg «Betalt dato» og «Betalt med». Trykk «Marker … som betalt» for å lagre.',
      ],
      tips: [
        'Bare ubetalte medlemskap kan krysses av.',
        '«Fjern valg» i linjen nederst fjerner alle kryssene.',
        'Ble noen ikke lagret, står navnene deres under «Ikke markert som betalt». Kanskje noen andre har gjort det allerede.',
      ],
    },
    en: {
      title: 'Mark many as paid',
      intro: 'If many people have paid, you can mark them all at once.',
      steps: [
        'Open the “Members” tab on “Memberships”. Pick “Unpaid” to see only the people who have not paid.',
        'Tick the people who paid, or tick “Select all … unpaid” at the top.',
        'Click “Mark … as paid” in the bar at the bottom.',
        'Pick “Paid on” and “Paid with”. Click “Mark … as paid” to save.',
      ],
      tips: [
        'You can only tick memberships that are not paid.',
        '“Clear” in the bar at the bottom removes all the ticks.',
        'If some didn’t save, their names show under “Not marked as paid”. Someone else may have done it already.',
      ],
    },
  },
  [TopicId.enum.reminders]: {
    area: HelpArea.enum.site,
    nb: {
      title: 'Purr på betaling',
      intro: 'Send én e-post til alle som ikke har betalt.',
      steps: [
        'Gå til fanen «Medlemmer» på «Medlemskap» og velg «Ubetalt».',
        'Trykk «Kopier … e-postadresser».',
        'Lim dem inn i Bcc-feltet i e-posten din. Da ser ikke mottakerne hverandres adresser.',
      ],
      tips: [
        'De uten konto er ikke med. Under knappen står det hvor mange det gjelder. Kontakt dem på en annen måte.',
        'Fra «Oversikt» kommer du rett hit med «Vis hvem».',
      ],
    },
    en: {
      title: 'Remind unpaid members',
      intro: 'Send one email to everyone who has not paid.',
      steps: [
        'Open the “Members” tab on “Memberships” and pick “Unpaid”.',
        'Click “Copy … emails”.',
        'Paste them into the Bcc field of your email. Then people don’t see each other’s addresses.',
      ],
      tips: [
        'People without an account are not included. Under the button it says how many. Reach them another way.',
        'From “Overview”, “Show who” takes you straight here.',
      ],
    },
  },
  [TopicId.enum.volunteers]: {
    area: HelpArea.enum.site,
    nb: {
      title: 'Dugnadsoversikt',
      intro:
        'Her ser styret hvem som står på hver vakt. Åpne kontomenyen på nettsiden, trykk «Styresider» og velg «Frivillige» i linjen øverst.',
      steps: [
        'Velg arrangement øverst. Kommende kommer først, tidligere ligger under.',
        '«Hvem vi mangler» viser ledige plasser per dag og lag.',
        'Hver vakt viser hvor mange som er på, for eksempel «2 av 3».',
        'Trykk «Legg til person» for å sette noen på en vakt. Velg «Bare et navn», eller «Koble til en konto» med e-posten deres.',
        'Ved hver person kan du skrive et notat som bare styret ser, eller fjerne dem fra vakten.',
      ],
      tips: [
        'Er vakten full, kan du likevel legge til en til med «Legg til likevel».',
        'Vaktene lager du i Studio. Se «Dugnadsvakter».',
        'Har noen andre satt opp en person på en vakt, står det «Lagt til av …» under navnet.',
      ],
    },
    en: {
      title: 'Volunteers screen',
      intro:
        'Here the board sees who is on each shift. Open the account menu on the website, click “Board pages” and pick “Volunteers” in the bar at the top.',
      steps: [
        'Pick the event at the top. Upcoming events come first, past ones below.',
        '“Who to find” shows the open spots per day and team.',
        'Each shift shows how many are on it, for example “2 of 3”.',
        'Click “Add person” to put someone on a shift. Pick “Just a name”, or “Link an account” with their email.',
        'Next to each person you can write a note only the board sees, or take them off the shift.',
      ],
      tips: [
        'If a shift is full, you can still add one more with “Add anyway”.',
        'You make the shifts in the Studio. See “Volunteer shifts”.',
        'If someone else put a person on a shift, “Added by …” shows under the name.',
      ],
    },
  },
  [TopicId.enum.printShifts]: {
    area: HelpArea.enum.site,
    nb: {
      title: 'Skriv ut vaktlisten',
      intro: 'Heng vaktlisten på veggen i hallen, så kan folk skrive seg på med penn.',
      steps: [
        'Trykk «Styresider», velg «Frivillige» i linjen øverst, og velg arrangementet.',
        'Trykk «Skriv ut vaktlisten». Du ser først hvordan arket blir.',
        'Trykk «Skriv ut». Hver dag starter på en ny side.',
        'Heng arket på veggen. Ledige plasser er tomme linjer, så folk kan skrive navnet sitt der.',
      ],
      tips: [
        'På mobil er knappen et skriverikon.',
        'Arket viser hvem som var påmeldt da du skrev det ut. Skriv ut på nytt hvis vaktene endrer seg.',
      ],
    },
    en: {
      title: 'Print the shift plan',
      intro: 'Put the shift plan on the wall in the hall, so people can sign up with a pen.',
      steps: [
        'Click “Board pages”, pick “Volunteers” in the bar at the top, and pick the event.',
        'Click “Print shift plan”. You see the sheet first.',
        'Click “Print”. Each day starts on a new page.',
        'Put the sheet on the wall. Open spots are empty lines, so people can write their name there.',
      ],
      tips: [
        'On a phone, the button is a printer icon.',
        'The sheet shows who was signed up when you printed it. Print again if the shifts change.',
      ],
    },
  },
  [TopicId.enum.boardAccess]: {
    area: HelpArea.enum.site,
    nb: {
      title: 'Styretilgang',
      intro: 'Administratorer kan åpne styresidene og redigere nettsiden. Her legger du dem til og fjerner dem.',
      steps: [
        'Åpne kontomenyen, trykk «Styresider» og velg «Styretilgang» i linjen øverst.',
        'Skriv e-posten personen logger inn med, og trykk «Legg til administrator».',
        'Står det at det ikke finnes noen konto, be personen logge inn på nettsiden én gang først.',
        'For å fjerne en administrator trykker du «Fjern» ved navnet og bekrefter med «Fjern».',
      ],
      tips: [
        'Du kan ikke fjerne deg selv. Be en annen administrator gjøre det. Det må alltid være minst én administrator.',
        'Den som fjernes, beholder kontoen og medlemskapene sine.',
        'Studio har sin egen innlogging. En ny administrator må også inviteres i Sanity for å redigere innholdet.',
        'Under hver administrator står det når de fikk tilgang og hvem som ga den. Administratorer fra før dette ble lagt til, har ingen slik linje.',
        'Administrator og styret er ikke det samme. Administratorer kan åpne styresidene. Hvem som er i styret, står i «Board members» i Studio.',
      ],
    },
    en: {
      title: 'Board access',
      intro: 'Admins can open the board pages and edit the website. Here you add and remove them.',
      steps: [
        'Open the account menu, click “Board pages” and pick “Board access” in the bar at the top.',
        'Type the email they log in with, and click “Add admin”.',
        'If it says there is no account yet, ask them to log in on the website once first.',
        'To remove an admin, click “Remove” next to the name and confirm with “Remove”.',
      ],
      tips: [
        'You can’t remove yourself. Ask another admin to do it. There must always be at least one admin.',
        'People you remove keep their account and memberships.',
        'The Studio has its own login. A new admin must also be invited in Sanity to edit the content.',
        'Under each admin you see when they got access and who gave it. Admins from before this was added have no such line.',
        'Admin and board are not the same. Admins can open the board pages. Who is on the board is set in “Board members” in the Studio.',
      ],
    },
  },
};
