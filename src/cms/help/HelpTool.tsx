import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Label,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
} from '@sanity/ui';
import { useState, type FC } from 'react';

import { currentLocale } from '~/i18n/current';

import {
  AREA_TITLES,
  GuideLanguage,
  HELP_TOPICS,
  HELP_UI,
  HelpArea,
  LANGUAGE_NAMES,
  TopicId,
  type HelpTopic,
} from './topics';

const PANEL_ID = 'help-panel';
const NUMBER_STYLE = { width: 28, height: 28, flex: 'none' } as const;
const NO_TOPICS: TopicId[] = [];
const TOPICS_BY_AREA = Map.groupBy(TopicId.options, (id) => HELP_TOPICS[id].area);

const tabId = (language: GuideLanguage) => `help-tab-${language}`;

const startLanguage = () => (currentLocale() === GuideLanguage.enum.en ? GuideLanguage.enum.en : GuideLanguage.enum.nb);

type NavProps = { language: GuideLanguage; selected: TopicId; onSelect: (id: TopicId) => void };

const TopicNav: FC<NavProps> = ({ language, selected, onSelect }) => (
  <Stack as="nav" gap={4} aria-label={HELP_UI[language].topics}>
    {HelpArea.options.map((area) => (
      <Stack key={area} gap={2}>
        <Box paddingX={3}>
          <Label size={1} muted>
            {AREA_TITLES[area][language]}
          </Label>
        </Box>
        <Grid gridTemplateColumns={[1, 2, 2, 1]} gap={1}>
          {(TOPICS_BY_AREA.get(area) ?? NO_TOPICS).map((id) => (
            <Button
              key={id}
              mode="bleed"
              justify="flex-start"
              textAlign="left"
              text={HELP_TOPICS[id][language].title}
              selected={id === selected}
              aria-current={id === selected || undefined}
              onClick={() => onSelect(id)}
            />
          ))}
        </Grid>
      </Stack>
    ))}
  </Stack>
);

const StepNumber: FC<{ value: number }> = ({ value }) => (
  <Card tone="primary" radius="full" style={NUMBER_STYLE}>
    <Flex height="fill" align="center" justify="center">
      <Text size={1} weight="semibold">
        {value}
      </Text>
    </Flex>
  </Card>
);

const TopicView: FC<{ topic: HelpTopic; language: GuideLanguage }> = ({ topic, language }) => {
  const { title, intro, steps, tips } = topic[language];
  return (
    <Card padding={[4, 4, 5]} radius={3} border>
      <Stack gap={5}>
        <Stack gap={3}>
          <Heading as="h2" size={2}>
            {title}
          </Heading>
          <Text muted>{intro}</Text>
        </Stack>
        <Stack as="ol" gap={4} margin={0} padding={0}>
          {steps.map((step, i) => (
            <Flex as="li" key={step} gap={3} align="flex-start">
              <StepNumber value={i + 1} />
              <Box flex={1} paddingTop={2}>
                <Text>{step}</Text>
              </Box>
            </Flex>
          ))}
        </Stack>
        {tips.map((tip) => (
          <Card key={tip} tone="primary" padding={3} radius={2} border>
            <Stack gap={2}>
              <Text size={1} weight="semibold">
                {HELP_UI[language].tip}
              </Text>
              <Text size={1}>{tip}</Text>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

export const HelpTool: FC = () => {
  const [language, setLanguage] = useState(startLanguage);
  const [topicId, setTopicId] = useState<TopicId>(TopicId.enum.access);
  const ui = HELP_UI[language];

  return (
    <Card height="fill" overflow="auto">
      <Container width={2} paddingX={4} paddingY={[4, 4, 5]} lang={language}>
        <Stack gap={5}>
          <Flex align="flex-start" justify="space-between" gap={4} wrap="wrap">
            <Stack gap={3} flex={1}>
              <Heading as="h1" size={3}>
                {ui.title}
              </Heading>
              <Text muted>{ui.intro}</Text>
            </Stack>
            <TabList gap={1} aria-label={ui.language}>
              {GuideLanguage.options.map((option) => (
                <Tab
                  key={option}
                  id={tabId(option)}
                  aria-controls={PANEL_ID}
                  label={LANGUAGE_NAMES[option]}
                  lang={option}
                  selected={option === language}
                  onClick={() => setLanguage(option)}
                />
              ))}
            </TabList>
          </Flex>
          <TabPanel id={PANEL_ID} aria-labelledby={tabId(language)}>
            <Grid gridTemplateColumns={[1, 1, 1, 3]} gap={5}>
              <TopicNav language={language} selected={topicId} onSelect={setTopicId} />
              <Box gridColumn={[1, 1, 1, 2]}>
                <TopicView topic={HELP_TOPICS[topicId]} language={language} />
              </Box>
            </Grid>
          </TabPanel>
        </Stack>
      </Container>
    </Card>
  );
};
