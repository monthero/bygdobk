import { z } from 'zod';

export const GuideLanguage = z.enum(['nb', 'en']);
export type GuideLanguage = z.infer<typeof GuideLanguage>;

export const HelpArea = z.enum(['studio', 'site']);
export type HelpArea = z.infer<typeof HelpArea>;

export const TopicId = z.enum([
  'access',
  'languages',
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
  'volunteers',
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
        'Du må være administrator. Den som styrer Supabase, slår på «is_admin» på profilen din.',
        'Åpne kontomenyen og trykk «Rediger nettsiden». Studio åpner seg i en ny fane.',
        'Studio har sin egen innlogging. Den som styrer Sanity, må invitere deg først.',
        'Velg det du vil endre i listen «Content» til venstre.',
        'Alt du skriver, lagres av seg selv som et utkast. Ingen ser det før du trykker «Publish» nederst til høyre.',
      ],
      tips: [
        'Felt med rød feilmelding må fikses før du kan publisere.',
        'Det kan ta noen minutter før endringen vises på nettsiden. Last inn siden på nytt.',
        '«Site settings», «Photos» og «Privacy» finnes bare én av hver. Det gjelder også treningsgruppene og dugnadsteamene. De kan ikke slettes.',
      ],
    },
    en: {
      title: 'Getting in',
      intro: 'Only admins can edit the website. What you change stays a draft until you publish it.',
      steps: [
        'Log in on the website with your account.',
        'You need to be an admin. The person who manages Supabase turns on “is_admin” on your profile.',
        'Open the account menu and click “Edit the site”. The Studio opens in a new tab.',
        'The Studio has its own login. The person who manages Sanity must invite you first.',
        'Pick what you want to change in the “Content” list on the left.',
        'Everything you type is saved as a draft on its own. Nobody sees it until you click “Publish” at the bottom right.',
      ],
      tips: [
        'Fields with a red error must be fixed before you can publish.',
        'It can take a few minutes before the website shows your change. Reload the page.',
        'There is only one “Site settings”, “Photos” and “Privacy”. The same goes for the training groups and volunteer teams. They can’t be deleted.',
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
      ],
    },
  },
  [TopicId.enum.news]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Skriv en nyhetssak',
      intro: 'Nyhetssaker vises på forsiden og under Nyheter.',
      steps: [
        'Åpne «News» og trykk på knappen for å lage en ny øverst i listen.',
        'Skriv «Title» og trykk «Generate» ved «URL name». Adressen lages fra den norske tittelen.',
        'Velg «Date» og «Category» (training, event, volunteer eller club). Skriv en kort «Summary» som vises i nyhetslisten.',
        'Skriv selve saken i «Article». Bruk «Heading» for mellomtitler og «Bullets» for punktlister. Fra verktøylinjen kan du sette inn «Callout» (faktaboks), «Quote» (sitat), «Table» (tabell) og bilder.',
        'Vil du ha et eget toppbilde, last det opp i «Banner image». Uten bilde bruker nettsiden et av klubbens bilder, ut fra kategorien.',
        'Handler saken om et arrangement eller en pause? Velg det i «About an event or break». Da viser saken arrangementet med en knapp dit.',
        'Under «Links» kan du legge til knapper. Velg en side under «Page on this site», eller lim inn en lenke under «Or a link to another site». Ikke begge.',
        'Trykk «Publish».',
      ],
      tips: [
        'Når arrangementet eller pausen er over, flytter saken seg fra toppen av nyhetslisten til arkivet.',
        'I en tabell er første rad overskriften.',
      ],
    },
    en: {
      title: 'Write a news post',
      intro: 'News posts show on the front page and under News.',
      steps: [
        'Open “News” and click the button at the top of the list to make a new one.',
        'Write the “Title” and click “Generate” next to “URL name”. The address is made from the Norwegian title.',
        'Pick the “Date” and the “Category” (training, event, volunteer or club). Write a short “Summary” for the news list.',
        'Write the post in “Article”. Use “Heading” for headings and “Bullets” for lists. From the toolbar you can add a “Callout” (a highlighted box), a “Quote”, a “Table” and images.',
        'For your own top image, upload it in “Banner image”. Without one, the website uses one of the club’s photos, based on the category.',
        'Is the post about an event or a break? Pick it in “About an event or break”. The post then shows the event with a button to it.',
        'Under “Links” you can add buttons. Pick a page under “Page on this site”, or paste a link under “Or a link to another site”. Not both.',
        'Click “Publish”.',
      ],
      tips: [
        'When the event or break is over, the post moves from the top of the news list to the archive.',
        'In a table, the first row is the header.',
      ],
    },
  },
  [TopicId.enum.training]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Treningstider',
      intro:
        'Hver trening er en «Calendar event» som gjentas hver uke. Én oppføring gjelder én gruppe på ett klokkeslett.',
      steps: [
        'Åpne «Calendar event», lag en ny og velg «training» under «Type».',
        'Velg «Training group».',
        'Sett «First day», «Starts at» og «Ends at». Skriv klokkeslett slik: 18:00.',
        'Under «Repeats every week» velger du ukedagene i «On» og siste dag i «Until».',
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
      intro: 'Each training is a “Calendar event” that repeats every week. One entry is for one group at one time.',
      steps: [
        'Open “Calendar event”, make a new one and pick “training” under “Type”.',
        'Pick the “Training group”.',
        'Set “First day”, “Starts at” and “Ends at”. Write times like this: 18:00.',
        'Under “Repeats every week”, pick the weekdays in “On” and the last day in “Until”.',
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
      intro: 'Det finnes ingen avlys-knapp. En annen oppføring i kalenderen på samme tid tar plassen til treningen.',
      steps: [
        'Lag en ny «Calendar event» og velg «break» under «Type». Det passer for ferier og for én avlyst kveld.',
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
      intro: 'There is no cancel button. Another calendar entry at the same time takes the place of the training.',
      steps: [
        'Make a new “Calendar event” and pick “break” under “Type”. Use it for holidays and for a single canceled evening.',
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
        'Turneringer, sosiale kvelder, møter og turer er også «Calendar event». Hvert arrangement får sin egen side.',
      steps: [
        'Lag en ny «Calendar event» og velg «tournament», «social», «meeting» eller «trip» under «Type».',
        'Skriv «Title» og «Description», og trykk «Generate» ved «URL name».',
        'Sett «First day», og «Last day» hvis det varer flere dager. «Starts at» og «Ends at» er valgfrie.',
        'Er datoen ikke bestemt? Slå av «The date is set» og skriv omtrent når under «When, in words», for eksempel «Våren 2027». Datoen brukes da bare til sortering.',
        'Fyll ut «Venue» hvis det ikke er i hjemmehallen. Tomt betyr hallen fra «Site settings». En tur må alltid ha en «Venue». Uten «Map link» åpner siden adressen i kartappen.',
        'Har arrangementet påmelding, fyll ut «Registration deadline» og «Registration link».',
        '«Tip box» viser en liten tipsboks på arrangementssiden.',
        'Trykk «Publish».',
      ],
      tips: [
        'De siste tre dagene før fristen viser siden «Stenger snart». Etter fristen er påmeldingen stengt.',
        'Arrangementer med fast dato kommer med i kalenderen folk abonnerer på med «Abonner» på Arrangementer-siden. Trening og pauser er ikke med.',
        'Et arrangement på samme tid som trening avlyser treningen. Se «Avlys trening».',
      ],
    },
    en: {
      title: 'Events',
      intro: 'Tournaments, socials, meetings and trips are also a “Calendar event”. Each event gets its own page.',
      steps: [
        'Make a new “Calendar event” and pick “tournament”, “social”, “meeting” or “trip” under “Type”.',
        'Write the “Title” and “Description”, and click “Generate” next to “URL name”.',
        'Set “First day”, and “Last day” if it lasts more than one day. “Starts at” and “Ends at” are optional.',
        'Date not decided yet? Turn off “The date is set” and write roughly when under “When, in words”, for example “Spring 2027”. The date is then only used to sort.',
        'Fill in the “Venue” if it is not in the home hall. Empty means the hall from “Site settings”. A trip always needs a “Venue”. Without a “Map link”, the site opens the address in the map app.',
        'If people must sign up, fill in “Registration deadline” and “Registration link”.',
        '“Tip box” shows a small tip on the event page.',
        'Click “Publish”.',
      ],
      tips: [
        'In the last three days before the deadline, the website shows “Closing soon”. After the deadline, sign-up is closed.',
        'Events with a set date are in the calendar feed people get with “Subscribe” on the Events page. Training and breaks are not.',
        'An event at the same time as a training cancels that training. See “Cancel a training”.',
      ],
    },
  },
  [TopicId.enum.shifts]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Dugnadsvakter',
      intro: 'Klubbens egne turneringer og sosiale kvelder kan ha dugnadsvakter som medlemmene melder seg på.',
      steps: [
        'Åpne arrangementet. «Type» må være «tournament» eller «social», og «Organized by the club» må være slått på.',
        'Da dukker «Volunteer shifts» opp. Legg til én vakt per lag og tidsrom.',
        'Velg «Team» (hall, kiosk eller secretariat), «Day», «Start», «End» og «People needed». Kryss av «Setup or teardown» for rigging og rydding.',
        'Trykk «Publish». På arrangementssiden kan innloggede medlemmer velge en ledig vakt og trykke «Meld deg på».',
        'Bruker dere også et regneark, lim inn lenken i «Sign-up link». Siden viser da en knapp til arket.',
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
        'Open the event. “Type” must be “tournament” or “social”, and “Organized by the club” must be on.',
        '“Volunteer shifts” then shows up. Add one shift per team and time slot.',
        'Pick the “Team” (hall, kiosk or secretariat), “Day”, “Start”, “End” and “People needed”. Check “Setup or teardown” for setting up and tidying up.',
        'Click “Publish”. On the event page, logged-in members pick a free shift and click “Sign up”.',
        'If you also use a spreadsheet, paste its link in “Sign-up link”. The website then shows a button to it.',
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
      intro: 'I «Site settings» styrer du meldingen øverst på alle sider og lenkene til sosiale medier.',
      steps: [
        'Åpne «Site settings» øverst i «Content». Velg fanen «Notice» eller «Social links».',
        'Under «Notice at the top of every page» skriver du «Text» og slår på «Show the notice».',
        'Velg «Tone»: «info» for vanlige beskjeder, «warning» for viktige (gul).',
        'Under «Social links» legger du til én lenke per plattform. Velg «Platform» og lim inn «Link». Lenken må starte med https://.',
        'Dra lenkene i den rekkefølgen du vil ha. Slik vises de i bunnen av siden, i menyen og på kontaktsiden.',
        'Trykk «Publish».',
      ],
      tips: ['Slå av «Show the notice» når meldingen er utdatert. Teksten blir liggende til neste gang.'],
    },
    en: {
      title: 'Notice and social links',
      intro: 'In “Site settings” you control the notice at the top of every page and the links to social media.',
      steps: [
        'Open “Site settings” at the top of “Content”. Pick the “Notice” or “Social links” tab.',
        'Under “Notice at the top of every page”, write the “Text” and turn on “Show the notice”.',
        'Pick the “Tone”: “info” for normal news, “warning” for important news (yellow).',
        'Under “Social links”, add one link per platform. Pick the “Platform” and paste the “Link”. It must start with https://.',
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
      intro: 'Prisene på «Medlemskap og priser» kommer fra «Membership plan». Rabattene kommer fra «Discount».',
      steps: [
        'Åpne «Membership plan» og endre en som finnes, eller lag en ny.',
        'Skriv «Name» og «Who it is for», og trykk «Generate» ved «URL name».',
        'Velg «Type». For «season» velger du også «Training group».',
        'Velg «Who can pick it»: «Adults», «Children» eller «Everyone». Det styrer hva som vises når noen melder inn seg selv eller et barn.',
        'Fyll ut «Membership fee (NOK)» og «Training fee (NOK)». Nettsiden viser summen som total. Med «Price per visit (NOK)» vises pris per gang i stedet.',
        '«Order» bestemmer rekkefølgen. Lavest tall kommer først.',
        'For rabatter: åpne «Discount» og skriv «Title» og «Text». De vises under «Rabatter og hjelp».',
        'Trykk «Publish».',
      ],
      tips: [
        'Prisen lagres i forespørselen når noen melder seg inn. Endrer du prisen senere, gjelder det bare nye forespørsler.',
        'For «dropin» viser siden Vipps-nummeret i stedet for en total.',
      ],
    },
    en: {
      title: 'Membership and prices',
      intro: 'The prices on “Membership and prices” come from “Membership plan”. The discounts come from “Discount”.',
      steps: [
        'Open “Membership plan” and change one, or make a new one.',
        'Write the “Name” and “Who it is for”, and click “Generate” next to “URL name”.',
        'Pick the “Type”. For “season”, also pick the “Training group”.',
        'Pick “Who can pick it”: “Adults”, “Children” or “Everyone”. This decides what shows when someone signs up themselves or a child.',
        'Fill in “Membership fee (NOK)” and “Training fee (NOK)”. The website shows the sum as the total. With “Price per visit (NOK)”, it shows a price per visit instead.',
        '“Order” sets the order. The lowest number comes first.',
        'For discounts: open “Discount” and write the “Title” and “Text”. They show under “Discounts and help”.',
        'Click “Publish”.',
      ],
      tips: [
        'The price is saved in the request when someone joins. If you change the price later, only new requests get it.',
        'For “dropin”, the website shows the Vipps number instead of a total.',
      ],
    },
  },
  [TopicId.enum.board]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Styret',
      intro: 'Styremedlemmene vises på klubbsiden med bilde, e-post og telefon.',
      steps: [
        'Åpne «Board member» og lag en ny.',
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
        'Open “Board member” and make a new one.',
        'Write the “Name” and “Role on the board”.',
        'Upload the “Photo”. It shows as a square, so put the hotspot on the face. See “Images”.',
        'Fill in “Email” and “Phone”. The phone number is 8 digits with no spaces.',
        '“Order” sets the order. The lowest number comes first.',
        'Click “Publish”.',
      ],
      tips: ['Someone left the board? Open the person and pick “Delete” in the menu next to “Publish”.'],
    },
  },
  [TopicId.enum.privacy]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Personvern',
      intro: 'Teksten på personvernsiden endrer du i «Privacy».',
      steps: [
        'Åpne «Privacy» øverst i «Content».',
        'Endre «Title» og «Text» på norsk og engelsk.',
        'Sett «Last updated» til datoen for endringen.',
        'Trykk «Publish».',
      ],
      tips: ['Siden finnes bare én gang, så den kan ikke slettes.'],
    },
    en: {
      title: 'Privacy',
      intro: 'You change the text on the privacy page in “Privacy”.',
      steps: [
        'Open “Privacy” at the top of “Content”.',
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
        'Åpne «Site settings» og fanen «Club».',
        '«Board email» er e-posten som vises på siden. Den får også meldinger fra kontaktskjemaet, hvis ikke et tema sier noe annet.',
        'Under «Home hall» skriver du navn og adresse på hallen. Trening og arrangementer uten egen «Venue» holdes her.',
        '«Map link» er valgfri. Uten den åpner siden adressen i kartappen til den som besøker.',
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
        'Open “Site settings” and the “Club” tab.',
        '“Board email” is the email shown on the site. It also gets contact form messages, unless a topic says otherwise.',
        'Under “Home hall”, write the hall’s name and address. Training and events without their own “Venue” are held here.',
        '“Map link” is optional. Without it, the site opens the address in the visitor’s map app.',
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
        'Åpne «Site settings» og fanen «Payment».',
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
        'Open “Site settings” and the “Payment” tab.',
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
        'Åpne «Site settings» og fanen «Contact form».',
        'Hvert tema har en «Label» (det besøkende ser), en «ID» og «Send to».',
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
        'Open “Site settings” and the “Contact form” tab.',
        'Each topic has a “Label” (what visitors see), an “ID” and “Send to”.',
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
        'Åpne «Training groups» i «Content» og velg en gruppe.',
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
        'Open “Training groups” in “Content” and pick a group.',
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
        'Åpne «Volunteer teams» i «Content» og velg et team.',
        'Endre «Name» og «What the team does».',
        'Trykk «Publish».',
      ],
      tips: ['Teamene er faste. Selve vaktene lager du på arrangementet. Se «Dugnadsvakter».'],
    },
    en: {
      title: 'Volunteer teams',
      intro: 'The name and text of the Hall, Kiosk and Secretariat teams. Shown when members sign up for shifts.',
      steps: [
        'Open “Volunteer teams” in “Content” and pick a team.',
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
        'Åpne «Sponsor» i «Content». Trykk på blyanten for en ny, eller velg en som finnes.',
        'Fyll ut «Name», «Logo» og «Website». En bred logo med gjennomsiktig bakgrunn ser best ut.',
        'Slå på «Show in the partner strip» og skriv «Text in the partner strip».',
        'Har sponsoren en medlemsfordel, fyll ut «Member deal»: «Intro», opptil fire «Perks» med ikon, stor og liten tekst, og «How to use it».',
        'Slå på «Show an "Ask for the code" button» hvis medlemmer trenger en kode fra styret.',
        'Sett «Order» for rekkefølgen. Lavere kommer først. Trykk «Publish».',
      ],
      tips: ['Uten medlemsfordeler skjules hele delen på medlemskapssiden.'],
    },
    en: {
      title: 'Sponsors and member deals',
      intro: 'Sponsors show in the strip above the footer. A member deal shows on the membership page.',
      steps: [
        'Open “Sponsor” in “Content”. Click the pencil for a new one, or pick one that exists.',
        'Fill in “Name”, “Logo” and “Website”. A wide logo with a see-through background looks best.',
        'Turn on “Show in the partner strip” and write the “Text in the partner strip”.',
        'If the sponsor has a member deal, fill in “Member deal”: the “Intro”, up to four “Perks” with an icon, big and small text, and “How to use it”.',
        'Turn on “Show an "Ask for the code" button” if members need a code from the board.',
        'Set “Order” for the order. Lower comes first. Click “Publish”.',
      ],
      tips: ['Without member deals, that whole part of the membership page is hidden.'],
    },
  },
  [TopicId.enum.photos]: {
    area: HelpArea.enum.studio,
    nb: {
      title: 'Sidebilder',
      intro: 'Bildene øverst på hver side, på forsidekortene og på nyheter uten toppbilde.',
      steps: [
        'Åpne «Photos» i «Content».',
        'Velg fanen «Pages», «Front page» eller «News without a banner».',
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
      intro: 'The photos at the top of each page, on the front page cards and on news without a banner.',
      steps: [
        'Open “Photos” in “Content”.',
        'Pick the “Pages”, “Front page” or “News without a banner” tab.',
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
      intro: 'Medlemmer og betaling styrer du på nettsiden, ikke i Studio. Åpne kontomenyen og trykk «Medlemskap».',
      steps: [
        'Når noen melder seg inn på «Bli medlem», havner forespørselen under «Forespørsler».',
        'Trykk «Godkjenn» for å gjøre personen til medlem, eller «Avslå». Avslåtte finner du med «Vis avslåtte». Der kan du trykke «Angre avslag».',
        'Under «Medlemmer» ser du medlemmene. Velg sesong øverst, og slå på «Bare ubetalte» for å se hvem som ikke har betalt.',
        'Når noen har betalt, trykk «Marker som betalt». Velg «Betalt dato» og «Betalt med», for eksempel Vipps eller bankoverføring.',
        'Med «Legg til medlemskap» legger du inn noen selv, for eksempel et barn uten konto. Blyanten endrer, søppelbøtta sletter.',
        '«Oversikt» viser antall medlemmer, hvor mange som har betalt, og hvor mye som er innbetalt per type. «Vis hvem» viser dem som ikke har betalt.',
        '«Last ned regneark» lagrer medlemmene i sesongen som en fil du kan åpne i Excel.',
      ],
      tips: ['Søk på navn eller e-post for å finne noen raskt.'],
    },
    en: {
      title: 'Members and payments',
      intro:
        'You handle members and payments on the website, not in the Studio. Open the account menu and click “Memberships”.',
      steps: [
        'When someone joins on “Join the club”, the request shows under “Requests”.',
        'Click “Approve” to make them a member, or “Decline”. Find declined ones with “Show declined”. There you can click “Undo decline”.',
        'Under “Members” you see the members. Pick the season at the top, and turn on “Unpaid only” to see who has not paid.',
        'When someone has paid, click “Mark as paid”. Pick “Paid on” and “Paid with”, for example Vipps or bank transfer.',
        'With “Add membership” you add someone yourself, for example a child without an account. The pencil edits, the trash can deletes.',
        '“Overview” shows how many members there are, how many have paid, and how much came in per plan. “Show who” lists the ones who have not paid.',
        '“Download spreadsheet” saves the season’s members as a file you can open in Excel.',
      ],
      tips: ['Search by name or email to find someone fast.'],
    },
  },
  [TopicId.enum.volunteers]: {
    area: HelpArea.enum.site,
    nb: {
      title: 'Dugnadsoversikt',
      intro: 'Her ser styret hvem som står på hver vakt. Åpne kontomenyen på nettsiden og trykk «Frivillige».',
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
      ],
    },
    en: {
      title: 'Volunteers screen',
      intro: 'Here the board sees who is on each shift. Open the account menu on the website and click “Volunteers”.',
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
      ],
    },
  },
};
