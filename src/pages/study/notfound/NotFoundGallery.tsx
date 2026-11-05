import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { PageToolbar } from '~/components/layout';
import { PageIntro } from '~/components/styles';
import { Segmented, type SegmentedOption } from '~/components/ui';
import { PHOTOS } from '~/data/photos';

import { CONCEPTS, type Concept } from './concepts';

import classes from './NotFoundGallery.module.css';

const ALL = 'all';

const ConceptFrame = memo<{ concept: Concept; index: number }>(({ concept, index }) => {
  const { i18n } = useLingui();
  return (
    <Paper withBorder radius="lg" className={classes.frame} id={`ide-${concept.slug}`}>
      <Group justify="space-between" className={classes.head}>
        <Group gap="sm">
          <Badge variant="light" size="lg" className="tabular">
            {index + 1}
          </Badge>
          <div>
            <Title order={2} className={classes.name}>
              {i18n._(concept.name)}
            </Title>
            <Text size="sm" c="dimmed">
              {i18n._(concept.idea)}
            </Text>
          </div>
        </Group>
      </Group>
      <div className={classes.stage}>
        <concept.Component />
      </div>
    </Paper>
  );
});

export const NotFoundGallery: FC = () => {
  const { i18n, t } = useLingui();
  const [shown, setShown] = useState(ALL);
  const pick = useCallback((value: string) => setShown(value), []);
  const options = useMemo<SegmentedOption<string>[]>(
    () => [{ value: ALL, label: t`All` }, ...CONCEPTS.map((c) => ({ value: c.slug, label: i18n._(c.name) }))],
    [i18n, t],
  );
  const list = shown === ALL ? CONCEPTS : CONCEPTS.filter((c) => c.slug === shown);

  return (
    <>
      <PageIntro
        photo={PHOTOS.hallSunset}
        eyebrow={<Trans>Study case</Trans>}
        title={<Trans>404 ideas</Trans>}
        lede={<Trans>Three ways to say “page not found” in badminton. Try them, then pick a favorite.</Trans>}
      />
      <PageToolbar>
        <Segmented label={t`404 idea`} options={options} value={shown} onChange={pick} />
      </PageToolbar>
      <Container py={40}>
        <Stack gap={40}>
          {list.map((concept) => (
            <ConceptFrame key={concept.slug} concept={concept} index={CONCEPTS.indexOf(concept)} />
          ))}
        </Stack>
      </Container>
    </>
  );
};
