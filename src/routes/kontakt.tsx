import { createFileRoute } from '@tanstack/react-router';

import { CONTACT_SEARCH } from '~/data/contact';
import { ContactPage } from '~/pages/contact/ContactPage';

export const Route = createFileRoute('/kontakt')({ validateSearch: CONTACT_SEARCH, component: ContactPage });
