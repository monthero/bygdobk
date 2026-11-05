import { createFileRoute } from '@tanstack/react-router';

import { NotFoundGallery } from '~/pages/study/notfound/NotFoundGallery';

export const Route = createFileRoute('/studie_/404')({ component: NotFoundGallery });
