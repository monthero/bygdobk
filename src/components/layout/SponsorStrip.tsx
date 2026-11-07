import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Button, Container, Text, ThemeIcon } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import { useSiteContent } from '~/cms/content';
import { ArrowRight, Handshake } from '~/components/ui';
import { DEAL_HASH } from '~/data/club';
import { contactLink, ContactTopic, SPONSOR_DRAFT } from '~/data/contact';

import classes from './SponsorStrip.module.css';

const LOGO_HEIGHT = 48;

export const SponsorStrip = memo(() => {
  const { t } = useLingui();
  const partners = useSiteContent().sponsors.filter((s) => s.inStrip);
  return (
    <aside className={classes.strip} aria-label={t`Partners`}>
      <Container size="lg" className={classes.inner}>
        {partners.length > 0 && (
          <div className={classes.partners}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" className={classes.eyebrow}>
              <Plural value={partners.length} one="Our partner" other="Our partners" />
            </Text>
            <ul className={classes.list}>
              {partners.map(({ id, name, url, logo, stripText, deal }) => (
                <li key={id} className={classes.partner}>
                  <a href={url} target="_blank" rel="noreferrer" className={classes.logo}>
                    <img
                      src={logo.url}
                      alt={name}
                      width={Math.round(logo.width * (LOGO_HEIGHT / logo.height))}
                      height={LOGO_HEIGHT}
                      loading="lazy"
                      decoding="async"
                    />
                  </a>
                  {(stripText || deal) && (
                    <Text size="sm" className={classes.partnerText}>
                      {stripText}{' '}
                      {deal && (
                        <Anchor component={Link} to="/medlemskap" hash={DEAL_HASH} size="sm" className={classes.more}>
                          <Trans>How it works</Trans>
                        </Anchor>
                      )}
                    </Text>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={classes.sponsor}>
          <ThemeIcon size={44} radius="md" variant="light" className={classes.sponsorIcon}>
            <Handshake />
          </ThemeIcon>
          <div className={classes.sponsorText}>
            <Text fw={700} lh={1.3}>
              <Trans>Want to sponsor the club?</Trans>
            </Text>
            <Text size="sm" c="dimmed" lh={1.35}>
              <Trans>Put your name on local badminton at Bygdøhus.</Trans>
            </Text>
          </div>
          <Button
            renderRoot={(props) => <Link {...props} {...contactLink(ContactTopic.enum.sponsor, t(SPONSOR_DRAFT))} />}
            variant="light"
            radius="xl"
            rightSection={<ArrowRight />}
            className={classes.sponsorButton}
          >
            <Trans>Get in touch</Trans>
          </Button>
        </div>
      </Container>
    </aside>
  );
});
