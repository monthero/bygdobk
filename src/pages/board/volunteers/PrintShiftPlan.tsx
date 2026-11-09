import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Button, Group, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { memo, type FC } from 'react';
import { createPortal } from 'react-dom';

import type { Shift } from '~/cms/calendar';
import { useClub, useTeams } from '~/cms/siteData';
import { eventVenue, eventWhen, shiftTime, type VisitorEvent } from '~/components/events';
import { Printer } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { date, DAY_AND_TIME, formatDate, wallTime } from '~/utils/dates';
import { volunteerName, type AdminShiftVolunteer } from '~/volunteers/model';
import { useEventVolunteers } from '~/volunteers/queries';

import { DAY_TITLE, NO_VOLUNTEERS, useShiftPlan, type DayPlan, type VolunteersByShift } from './shiftPlan';

import classes from './PrintShiftPlan.module.css';

const PREVIEW_WIDTH = 880;

const print = () => window.print();

const ShiftLines: FC<{ shift: Shift; volunteers: readonly AdminShiftVolunteer[] }> = ({ shift, volunteers }) => {
  const { t } = useLingui();
  const open = Math.max(shift.spots - volunteers.length, 0);
  return (
    <ol className={classes.lines}>
      {volunteers.map((v) => (
        <li key={v.id} className={classes.line}>
          {volunteerName(v)}
        </li>
      ))}
      {Array.from({ length: open }, (_, i) => (
        <li key={i} className={classes.line} aria-label={t`Open spot`} />
      ))}
    </ol>
  );
};

type SheetProps = {
  event: VisitorEvent;
  days: readonly DayPlan[];
  byShift: VolunteersByShift;
  updatedAt: number;
};

const ShiftSheet = memo<SheetProps>(({ event, days, byShift, updatedAt }) => {
  const { t } = useLingui();
  const teams = useTeams();
  const venue = eventVenue(event, useClub().venue);
  const where = venue && [venue.name, venue.address].filter(Boolean).join(', ');
  const details = [eventWhen(event), where].filter(Boolean).join(' · ');
  const asOf = formatDate(wallTime(new Date(updatedAt).toISOString()), DAY_AND_TIME);
  return (
    <article className={classes.sheet}>
      <header className={classes.sheet__head}>
        <p className={classes.sheet__eyebrow}>
          <Trans>Volunteer shifts</Trans>
        </p>
        <h1 className={classes.sheet__title}>{event.title}</h1>
        {details && <p className={classes.sheet__details}>{details}</p>}
        <p className={classes.sheet__hint}>
          <Trans>Empty line? Write your name on it.</Trans>{' '}
          <span className={classes['sheet__as-of']}>
            <Trans comment="When the printed list of volunteers was last loaded, e.g. As of Mon 9 Nov, 14:32">
              As of {asOf}
            </Trans>
          </span>
        </p>
      </header>
      {days.map(({ day, teams: dayTeams }, index) => (
        <section key={day} className={classes.day}>
          {index > 0 && <p className={classes.sheet__eyebrow}>{event.title}</p>}
          <h2 className={classes.day__title}>{formatDate(date(day), DAY_TITLE)}</h2>
          {dayTeams.map(({ team, shifts }) => (
            <section key={team} className={classes.team}>
              <h3 className={classes.team__title}>{teams[team].name}</h3>
              <dl className={classes.shifts}>
                {shifts.map((shift) => (
                  <div key={shift._key} className={classes.shift}>
                    <dt className={classes.shift__time}>
                      <span className="tabular">{shiftTime(shift)}</span>
                      {shift.setup && <span className={classes.shift__tag}>{t`setup or teardown`}</span>}
                    </dt>
                    <dd className={classes.shift__people}>
                      <ShiftLines shift={shift} volunteers={byShift.get(shift._key) ?? NO_VOLUNTEERS} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </section>
      ))}
    </article>
  );
});

export const PrintShiftPlan: FC<{ event: VisitorEvent }> = ({ event }) => {
  const { t } = useLingui();
  const list = useEventVolunteers(event.id);
  const { days, byShift } = useShiftPlan(event.shifts, list.data ?? NO_VOLUNTEERS);
  const [opened, { open, close }] = useDisclosure(false);
  const isMobile = useIsMobile();
  const ready = list.isSuccess;
  const sheet = ready && <ShiftSheet event={event} days={days} byShift={byShift} updatedAt={list.dataUpdatedAt} />;

  return (
    <>
      <Button
        ms="auto"
        radius="xl"
        variant="default"
        leftSection={<Printer />}
        onClick={open}
        loading={list.isPending}
        disabled={!ready}
        visibleFrom="sm"
      >
        <Trans>Print shift plan</Trans>
      </Button>
      <ActionIcon
        ms="auto"
        size="lg"
        radius="xl"
        variant="default"
        aria-label={t`Print shift plan`}
        onClick={open}
        loading={list.isPending}
        disabled={!ready}
        hiddenFrom="sm"
      >
        <Printer />
      </ActionIcon>

      <Modal.Root opened={opened} onClose={close} size={PREVIEW_WIDTH} fullScreen={isMobile}>
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Header>
            <div>
              <Modal.Title fw={700}>
                <Trans>Print preview</Trans>
              </Modal.Title>
              {days.length > 1 && (
                <Text size="sm" c="dimmed">
                  <Trans>Each day starts on a new page.</Trans>
                </Text>
              )}
            </div>
            <Group gap="xs" wrap="nowrap">
              <Button radius="xl" leftSection={<Printer />} onClick={print} data-autofocus>
                <Trans>Print</Trans>
              </Button>
              <Modal.CloseButton aria-label={t`Close`} />
            </Group>
          </Modal.Header>
          <Modal.Body className={classes.preview}>
            <div className={classes.paper}>{sheet}</div>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>

      {sheet &&
        createPortal(
          <div className={classes.print} data-print-sheet>
            {sheet}
          </div>,
          document.body,
        )}
    </>
  );
};
