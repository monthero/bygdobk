import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Inline,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
} from '@sanity/ui';
import {
  useMutation,
  useMutationState,
  useQuery,
  type Mutation,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useMemo, useState, type FC } from 'react';
import { getPublishedId, SanityDefaultPreview, useClient, useSchema } from 'sanity';
import { useIntentLink } from 'sanity/router';
import { z } from 'zod';

import { ArrowCounterClockwise, CheckCircle, Translate } from '~/components/ui/icons';
import { LOCALE_META, REQUIRED_LOCALES, type Locale } from '~/i18n/locales';

import { SCHEMA_TYPES } from '../schema';
import { API_VERSION } from '../structure';
import { gapsOf, missingTranslationsQuery, RawDoc, translatedTypes, type DocGaps } from './missing';
import { translateDocument, type TranslateOutcome } from './translate';
import { TranslateStatus, type TranslateState } from './TranslateStatus';

const GapKind = z.enum(['required', 'optional']);
type GapKind = z.infer<typeof GapKind>;

const DOCUMENT_TYPES = SCHEMA_TYPES.flatMap((type) => (type.type === 'document' ? [type.name] : []));
const RawDocs = z.array(RawDoc);
const PANEL_ID = 'translations-panel';
const PREVIEW_BOX = { minWidth: 220 } as const;
const ROW_LINK = { minWidth: 260 } as const;
const OK_ICON = { color: 'var(--card-badge-positive-icon-color)', flex: 'none' } as const;

const LANGUAGE_LIST = new Intl.ListFormat('en', { type: 'conjunction' });
const REQUIRED_NAMES = LANGUAGE_LIST.format(Array.from(REQUIRED_LOCALES, (locale) => LOCALE_META[locale].name));

const TAB_TITLES: Record<GapKind, string> = {
  [GapKind.enum.required]: 'Must fix',
  [GapKind.enum.optional]: 'Optional',
};

const ALL_DONE: Record<GapKind, string> = {
  [GapKind.enum.required]: `${REQUIRED_NAMES} are filled in everywhere.`,
  [GapKind.enum.optional]: 'All optional languages are filled in.',
};

const tabId = (kind: GapKind) => `translations-tab-${kind}`;

type MissingOptions = Omit<UseQueryOptions<DocGaps[]>, 'queryKey' | 'queryFn'>;

const useMissingTranslations = (options?: MissingOptions) => {
  const client = useClient({ apiVersion: API_VERSION });
  const schema = useSchema();
  const translated = useMemo(() => translatedTypes(DOCUMENT_TYPES.flatMap((name) => schema.get(name) ?? [])), [schema]);
  return useQuery({
    queryKey: ['studio', 'missingTranslations'],
    queryFn: async ({ signal }) => {
      const byType = new Map(translated.map((entry, order) => [entry.type.name, { entry, order }]));
      const raw = await client
        .withConfig({ perspective: 'drafts' })
        .fetch(missingTranslationsQuery(translated), { types: Array.from(byType.keys()) }, { signal });
      const docs = RawDocs.parse(raw).flatMap((doc) => {
        const type = byType.get(doc._type);
        const gaps = type && gapsOf(doc, type.entry, getPublishedId(doc._id));
        return gaps ? [{ gaps, order: type.order }] : [];
      });
      return docs.sort((a, b) => a.order - b.order).map(({ gaps }) => gaps);
    },
    staleTime: 0,
    ...options,
  });
};

type TranslateOptions = Omit<UseMutationOptions<TranslateOutcome>, 'mutationKey' | 'mutationFn'>;

const translateKey = (id: string) => ['studio', 'translate', id] as const;

const stateOf = (mutation: Mutation): TranslateState => mutation.state as TranslateState;

const useTranslateDocument = (doc: DocGaps, options?: TranslateOptions) => {
  const client = useClient({ apiVersion: API_VERSION });
  const { mutate } = useMutation({
    mutationKey: translateKey(doc.id),
    mutationFn: () => translateDocument(client, doc.id, doc.nodes),
    ...options,
  });
  const state = useMutationState({ filters: { mutationKey: translateKey(doc.id) }, select: stateOf }).at(-1);
  return { state, translate: () => mutate() };
};

const languageName = (locale: Locale) => LOCALE_META[locale].name;

const Gaps: FC<{ doc: DocGaps; kind: GapKind }> = ({ doc, kind }) => {
  if (kind === GapKind.enum.optional) {
    return (
      <Inline gap={1}>
        {doc.optional.map((locale) => (
          <Badge key={locale}>{languageName(locale)}</Badge>
        ))}
      </Inline>
    );
  }
  return (
    <Stack gap={2}>
      {doc.required.map(({ locale, fields }) => (
        <Flex key={locale} gap={2} align="center" wrap="wrap">
          <Badge tone="critical">{languageName(locale)}</Badge>
          <Text size={1} muted>
            {fields.join(', ')}
          </Text>
        </Flex>
      ))}
    </Stack>
  );
};

const DocRow: FC<{ doc: DocGaps; kind: GapKind }> = ({ doc, kind }) => {
  const link = useIntentLink({ intent: 'edit', params: { id: doc.id, type: doc.type.name } });
  const { state, translate } = useTranslateDocument(doc);
  return (
    <Card radius={2} border>
      <Flex align="center" gap={1} wrap="wrap" padding={1}>
        <Card as="a" {...link} flex={1} padding={2} radius={2} style={ROW_LINK}>
          <Flex align="center" gap={3} wrap="wrap">
            <Box flex={1} style={PREVIEW_BOX}>
              <SanityDefaultPreview
                title={doc.preview.title}
                subtitle={doc.preview.subtitle}
                media={doc.preview.media}
                icon={doc.type.icon}
                layout="default"
              />
            </Box>
            {state?.status !== 'success' && (
              <Box paddingX={2}>
                <Gaps doc={doc} kind={kind} />
              </Box>
            )}
          </Flex>
        </Card>
        <Box padding={1}>
          <Button
            mode="ghost"
            icon={Translate}
            text="Translate missing"
            disabled={state?.status === 'pending'}
            onClick={translate}
          />
        </Box>
      </Flex>
      <TranslateStatus state={state} />
    </Card>
  );
};

const GapList: FC<{ docs: DocGaps[]; kind: GapKind }> = ({ docs, kind }) => {
  const groups = useMemo(() => Map.groupBy(docs, (doc) => doc.type), [docs]);
  if (docs.length === 0) {
    return (
      <Card tone="positive" padding={4} radius={3} border>
        <Text>{ALL_DONE[kind]}</Text>
      </Card>
    );
  }
  return (
    <Stack gap={5}>
      {Array.from(groups, ([type, group]) => (
        <Stack key={type.name} gap={3}>
          <Heading as="h2" size={1}>
            {type.title ?? type.name} ({group.length})
          </Heading>
          <Stack gap={2}>
            {group.map((doc) => (
              <DocRow key={doc.id} doc={doc} kind={kind} />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
};

const AllTranslated: FC = () => (
  <Card tone="positive" padding={5} radius={3} border>
    <Flex gap={3} align="center">
      <Box style={OK_ICON}>
        <CheckCircle width={32} height={32} />
      </Box>
      <Stack gap={3}>
        <Heading as="h2" size={2}>
          Everything is translated
        </Heading>
        <Text muted>Every text has all its languages. Nice work!</Text>
      </Stack>
    </Flex>
  </Card>
);

const Results: FC<{ docs: DocGaps[] }> = ({ docs }) => {
  const [picked, setPicked] = useState<GapKind>();
  const byKind: Record<GapKind, DocGaps[]> = useMemo(
    () => ({
      [GapKind.enum.required]: docs.filter((doc) => doc.required.length > 0),
      [GapKind.enum.optional]: docs.filter((doc) => doc.optional.length > 0),
    }),
    [docs],
  );
  if (docs.length === 0) return <AllTranslated />;
  const selected = picked ?? (byKind.required.length > 0 ? GapKind.enum.required : GapKind.enum.optional);
  return (
    <Stack gap={4}>
      <TabList gap={1} aria-label="Missing translations">
        {GapKind.options.map((kind) => (
          <Tab
            key={kind}
            id={tabId(kind)}
            aria-controls={PANEL_ID}
            label={`${TAB_TITLES[kind]} (${byKind[kind].length})`}
            tone={kind === GapKind.enum.required && byKind[kind].length > 0 ? 'critical' : 'default'}
            selected={kind === selected}
            onClick={() => setPicked(kind)}
          />
        ))}
      </TabList>
      <TabPanel id={PANEL_ID} aria-labelledby={tabId(selected)}>
        <GapList docs={byKind[selected]} kind={selected} />
      </TabPanel>
    </Stack>
  );
};

const Status: FC<{ query: ReturnType<typeof useMissingTranslations> }> = ({ query }) => {
  if (query.isPending) {
    return (
      <Flex gap={3} align="center" padding={4}>
        <Spinner muted />
        <Text muted>Checking all texts…</Text>
      </Flex>
    );
  }
  if (query.isError) {
    return (
      <Card tone="critical" padding={4} radius={3} border>
        <Stack gap={4}>
          <Text>Could not check the texts. Check your connection and try again.</Text>
          <Box>
            <Button text="Try again" tone="critical" onClick={() => void query.refetch()} />
          </Box>
        </Stack>
      </Card>
    );
  }
  return <Results docs={query.data} />;
};

export const TranslationsTool: FC = () => {
  const query = useMissingTranslations();
  return (
    <Card height="fill" overflow="auto">
      <Container width={2} paddingX={4} paddingY={[4, 4, 5]}>
        <Stack gap={5}>
          <Flex align="flex-start" justify="space-between" gap={4} wrap="wrap">
            <Stack gap={3} flex={1}>
              <Heading as="h1" size={3}>
                Translations
              </Heading>
              <Text muted>
                {REQUIRED_NAMES} must be filled in. The other languages are optional: when one is empty, visitors see
                Norwegian instead (English for Chinese). Pick a text to fix it.
              </Text>
            </Stack>
            <Button
              mode="ghost"
              icon={ArrowCounterClockwise}
              text="Check again"
              loading={query.isFetching}
              disabled={query.isPending}
              onClick={() => void query.refetch()}
            />
          </Flex>
          <Status query={query} />
        </Stack>
      </Container>
    </Card>
  );
};
