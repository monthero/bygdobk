const pick = (field: string) =>
  `select(length(${field}[$locale]) > 0 => ${field}[$locale], length(${field}[$fallback]) > 0 => ${field}[$fallback], ${field}.nb)`;

export const localized = (...fields: string[]) => fields.map((field) => `"${field}": ${pick(field)}`).join(', ');

export const CONTENT_GROQ = `{
  "notice": *[_id == "notice"][0] { visible, tone, ${localized('text')} },
  "socials": *[_id == "socialLinks"][0].links[] { platform, url },
  "club": *[_id == "clubDetails"][0] { email, venue, orgNr, whistleblowingUrl, spondCode },
  "payment": *[_id == "payment"][0] { vipps, accountNumber, ${localized('instructions')} },
  "contactTopics": *[_id == "contactForm"][0].topics[] { id, ${localized('label')} },
  "photos": *[_id == "sitePhotos"][0],
  "groups": *[_type == "trainingGroup"] { key, coached, status, ${localized('name', 'who', 'statusNote')} },
  "teams": *[_type == "volunteerTeam"] { key, ${localized('name', 'what')} },
  "sponsors": *[_type == "sponsor"] | order(order asc) {
    "id": _id, name, url, inStrip, ${localized('stripText')},
    "logo": logo.asset-> { url, "width": metadata.dimensions.width, "height": metadata.dimensions.height },
    "deal": deal { askForCode, ${localized('intro', 'howTo')}, "perks": perks[] { _key, icon, ${localized('value', 'label')} } }
  },
  "news": *[_type == "newsPost"] | order(date desc) {
    "slug": slug.current, date, kind, ${localized('title', 'summary')},
    "links": links[] { _key, page, hash, url, ${localized('label')} },
    "banner": banner { ..., ${localized('alt')}, "lqip": asset->metadata.lqip },
    "eventId": event._ref,
    "author": createdBy.name
  },
  "events": *[_type == "event"] | order(startDate asc) {
    "id": _id, kind, "slug": slug.current, group, groups, startDate, endDate, dateConfirmed,
    ${localized('title', 'whenText', 'description')},
    "tip": tip { ${localized('title', 'text')} },
    startTime, endTime, recurrence, ownEvent, venue, registrationDeadline, registrationUrl, signupUrl, shifts,
    "banner": banner { ..., ${localized('alt')}, "lqip": asset->metadata.lqip }
  },
  "plans": *[_type == "membershipPlan"] | order(order asc) {
    "id": slug.current, kind, audience, group, ${localized('name', 'note')}, membership, training, perVisit
  },
  "discounts": *[_type == "discount"] | order(order asc) { ${localized('title', 'body')} },
  "board": *[_type == "boardMember"] | order(order asc) { "id": _id, name, ${localized('role')}, photo, email, phone }
}`;

export const NEWS_BODY_GROQ = `*[_type == "newsPost" && slug.current == $slug][0] { ${localized('body')} }`;

export const NEWS_BODIES_GROQ = `*[_type == "newsPost"] { "slug": slug.current, ${localized('body')} }`;

export const PRIVACY_GROQ = `*[_id == "privacyPage"][0] { ${localized('title', 'body')}, updatedAt }`;
