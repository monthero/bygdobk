import type { FC } from 'react';

import type { JsonLdData } from './structuredData';

export const JsonLd: FC<{ data: JsonLdData | undefined }> = ({ data }) =>
  data ? <script type="application/ld+json">{JSON.stringify(data)}</script> : null;
