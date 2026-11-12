import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Button, Container, Group, Stack, Stepper, Text } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import { ArrowLeft, ArrowRight, Check, CourtTexture } from '~/components/ui';

import { StickyBar } from './FormParts';

import classes from './SetupSteps.module.css';

export type SetupStep = { title: string; icon: ReactNode; content: ReactNode; invalid?: string | null };

const STEPPER_CLASS_NAMES = {
  root: classes.stepper,
  step: classes.step,
  stepBody: classes.stepBody,
  stepLabel: classes.stepLabel,
  separator: classes.separator,
  stepIcon: classes.stepIcon,
};
const COMPLETED_ICON = <Check />;

type Props = {
  steps: SetupStep[];
  active: number;
  onStep: (index: number) => void;
  jumpAhead: boolean;
  reason: string | null;
  warn: boolean;
  finalActions: ReactNode;
  compactBack: boolean;
};

export const SetupSteps: FC<Props> = ({
  steps,
  active,
  onStep,
  jumpAhead,
  reason,
  warn,
  finalActions,
  compactBack,
}) => {
  const { t } = useLingui();
  const step = steps[active];
  const last = active === steps.length - 1;
  const number = active + 1;
  const total = steps.length;
  const name = step?.title ?? '';
  const nextName = steps[active + 1]?.title ?? '';

  return (
    <>
      <div className={classes.head}>
        <CourtTexture />
        <Container>
          <Stack gap={8}>
            <Text size="sm" fw={700} className={classes.count}>
              <Trans comment="Setup progress, e.g. Step 2 of 4 · Scoring">
                Step {number} of {total} · {name}
              </Trans>
            </Text>
            <Stepper
              active={active}
              onStepClick={onStep}
              size="sm"
              iconSize={34}
              color="brand"
              autoContrast
              completedIcon={COMPLETED_ICON}
              allowNextStepsSelect={jumpAhead}
              classNames={STEPPER_CLASS_NAMES}
            >
              {steps.map((s) => (
                <Stepper.Step key={s.title} icon={s.icon} label={s.title} />
              ))}
            </Stepper>
          </Stack>
        </Container>
      </div>
      <Container py="md">
        <Stack gap="md">{step?.content}</Stack>
      </Container>
      <StickyBar reason={last ? reason : (step?.invalid ?? null)} warn={last ? warn : true}>
        <Group gap="sm" wrap="nowrap" className={classes.actions} data-final={(last && compactBack) || undefined}>
          {active > 0 &&
            (last && compactBack ? (
              <ActionIcon
                size={50}
                radius="md"
                variant="default"
                aria-label={t`Back`}
                onClick={() => onStep(active - 1)}
              >
                <ArrowLeft />
              </ActionIcon>
            ) : (
              <Button size="lg" variant="default" leftSection={<ArrowLeft />} onClick={() => onStep(active - 1)}>
                <Trans>Back</Trans>
              </Button>
            ))}
          {last ? (
            finalActions
          ) : (
            <Button
              size="lg"
              rightSection={<ArrowRight />}
              disabled={Boolean(step?.invalid)}
              aria-label={t`Next: ${nextName}`}
              onClick={() => onStep(active + 1)}
            >
              <Trans>Next</Trans>
            </Button>
          )}
        </Group>
      </StickyBar>
    </>
  );
};
