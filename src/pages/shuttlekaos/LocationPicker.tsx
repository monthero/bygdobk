import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link } from '@tanstack/react-router';
import { useState, type FC } from 'react';

import { Check, Crosshair, Info, MagnifyingGlass, MapPin, ResponsiveModal, X } from '~/components/ui';
import { contactLink, ContactTopic } from '~/data/contact';
import type { SessionLocation } from '~/shuttlekaos/model';

import { filterLocations, isLocationDenied, mapsUrl, useLocations, useNearestLocation } from './locations';

import classes from './LocationPicker.module.css';

const EMPTY: SessionLocation[] = [];

const RulesNote: FC = () => (
  <Trans>
    Every hall has its own rules. Some only let in members of the club that rents it, others charge a fee. Only pick a
    hall you know how to get into.
  </Trans>
);

export const LocationLink: FC<{ location: SessionLocation }> = ({ location }) => (
  <Anchor href={mapsUrl(location)} target="_blank" rel="noopener noreferrer" className={classes.link}>
    <MapPin aria-hidden />
    {location.name}
  </Anchor>
);

type ModalProps = {
  opened: boolean;
  value: SessionLocation | null;
  notice: string | null;
  onClose: () => void;
  onPick: (location: SessionLocation) => void;
};

const LocationModal: FC<ModalProps> = ({ opened, value, notice, onClose, onPick }) => {
  const { t } = useLingui();
  const [query, setQuery] = useState('');
  const locations = useLocations();
  const shown = filterLocations(locations.data ?? EMPTY, query);
  const trimmed = query.trim();

  return (
    <ResponsiveModal opened={opened} onClose={onClose} title={<Trans>Set location</Trans>}>
      <Stack gap="sm">
        {notice && <Text size="sm">{notice}</Text>}
        <Alert variant="light" color="yellow" icon={<Info />}>
          <RulesNote />
        </Alert>
        <TextInput
          size="md"
          aria-label={t`Search halls`}
          placeholder={t`Search halls`}
          leftSection={<MagnifyingGlass />}
          value={query}
          autoComplete="off"
          data-autofocus
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        {locations.isPending && <Loader size="sm" />}
        {locations.isError && (
          <Text size="sm" c="red">
            <Trans>Couldn't load the halls. Try again.</Trans>
          </Text>
        )}
        {shown.length > 0 && (
          <ul className={classes.list}>
            {shown.map((location) => {
              const selected = value?.locationId === location.locationId;
              return (
                <li key={location.locationId}>
                  <UnstyledButton
                    className={classes.row}
                    data-selected={selected || undefined}
                    aria-pressed={selected}
                    onClick={() => onPick(location)}
                  >
                    <MapPin className={classes.rowIcon} aria-hidden />
                    <span className={classes.rowText}>
                      <span className={classes.rowName}>{location.name}</span>
                      {location.address && <span className={classes.rowAddress}>{location.address}</span>}
                    </span>
                    {selected && <Check className={classes.rowCheck} aria-hidden />}
                  </UnstyledButton>
                </li>
              );
            })}
          </ul>
        )}
        {trimmed && locations.isSuccess && shown.length === 0 && (
          <Text size="sm" c="dimmed">
            <Trans>No hall matches "{trimmed}".</Trans>
          </Text>
        )}
        <Text size="sm" c="dimmed">
          <Trans>Missing a hall?</Trans>{' '}
          <Anchor
            renderRoot={(props) => (
              <Link
                {...props}
                {...contactLink(ContactTopic.enum.other, t`Hi! Please add this hall to ShuttleKaos: `)}
              />
            )}
          >
            <Trans>Ask the board to add it</Trans>
          </Anchor>
        </Text>
      </Stack>
    </ResponsiveModal>
  );
};

type Props = { value: SessionLocation | null; onChange: (location: SessionLocation | null) => void };

export const LocationPicker: FC<Props> = ({ value, onChange }) => {
  const { t } = useLingui();
  const [opened, controls] = useDisclosure(false);
  const [notice, setNotice] = useState<string | null>(null);
  const nearest = useNearestLocation({
    onSuccess: (location) => {
      if (location) {
        onChange(location);
        return;
      }
      setNotice(t`No hall from the list is close to you. Pick one here.`);
      controls.open();
    },
  });

  let locateError: string | null = null;
  if (nearest.error) {
    locateError = isLocationDenied(nearest.error)
      ? t`Location access is off. Allow it in the browser, or pick the hall from the list.`
      : t`Couldn't find where you are. Pick the hall from the list.`;
  }

  const pick = (location: SessionLocation) => {
    onChange(location);
    controls.close();
  };

  const openList = () => {
    setNotice(null);
    controls.open();
  };

  return (
    <Stack gap={8}>
      {value ? (
        <Paper withBorder radius="md" p="sm" className={classes.chosen}>
          <MapPin className={classes.rowIcon} aria-hidden />
          <span className={classes.rowText}>
            <span className={classes.rowName}>{value.name}</span>
            {value.address && <span className={classes.rowAddress}>{value.address}</span>}
          </span>
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            size={40}
            aria-label={t`Remove location`}
            onClick={() => onChange(null)}
          >
            <X />
          </ActionIcon>
        </Paper>
      ) : (
        <Text size="sm" c="dimmed">
          <Trans>No location. Add one so people know where to go.</Trans>
        </Text>
      )}
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs">
        <Button
          variant="light"
          leftSection={<Crosshair />}
          loading={nearest.isPending}
          onClick={() => nearest.mutate()}
        >
          <Trans>Use current location</Trans>
        </Button>
        <Button variant="default" leftSection={<MapPin />} onClick={openList}>
          {value ? <Trans>Change location</Trans> : <Trans>Set location</Trans>}
        </Button>
      </SimpleGrid>
      {locateError && (
        <Text size="sm" c="red">
          {locateError}
        </Text>
      )}
      {value && (
        <Text size="xs" c="dimmed">
          <RulesNote />
        </Text>
      )}
      <LocationModal opened={opened} value={value} notice={notice} onClose={controls.close} onPick={pick} />
    </Stack>
  );
};
