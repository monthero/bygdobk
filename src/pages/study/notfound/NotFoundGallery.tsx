import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { PageToolbar } from '~/components/layout';
import { PageIntro } from '~/components/styles';
import { Segmented, type SegmentedOption } from '~/components/ui';
import { PHOTOS } from '~/data/photos';
import { usePageTitle } from '~/hooks/usePageTitle';

import { IDEAS, type Idea } from './ideas';

import classes from './NotFoundGallery.module.css';

const ALL = 'all';

const IdeaFrame = memo<{ idea: Idea; index: number }>(({ idea, index }) => {
  const { i18n } = useLingui();
  return (
    <Paper withBorder radius="lg" className={classes.frame} id={`ide-${idea.slug}`}>
      <Group justify="space-between" className={classes.head}>
        <Group gap="sm">
          <Badge variant="light" size="lg" className="tabular">
            {index + 1}
          </Badge>
          <div>
            <Title order={2} className={classes.name}>
              {i18n._(idea.name)}
            </Title>
            <Text size="sm" c="dimmed">
              {i18n._(idea.idea)}
            </Text>
          </div>
        </Group>
      </Group>
      <div className={classes.stage}>
        <idea.Component />
      </div>
    </Paper>
  );
});

export const NotFoundGallery: FC = () => {
  const { i18n, t } = useLingui();
  usePageTitle(t`404 ideas`);
  const [shown, setShown] = useState(ALL);
  const pick = useCallback((value: string) => setShown(value), []);
  const options = useMemo<SegmentedOption<string>[]>(
    () => [{ value: ALL, label: t`All` }, ...IDEAS.map((c) => ({ value: c.slug, label: i18n._(c.name) }))],
    [i18n, t],
  );
  const list = shown === ALL ? IDEAS : IDEAS.filter((c) => c.slug === shown);

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
          {list.map((idea) => (
            <IdeaFrame key={idea.slug} idea={idea} index={IDEAS.indexOf(idea)} />
          ))}
        </Stack>
      </Container>
    </>
  );
};
