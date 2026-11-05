import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Container, Stack, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, type FC } from 'react';

import { AddressLink, SocialLinks, ArrowUpRight, ClubLogo } from '~/components/ui';
import { CLUB } from '~/data/club';
import { FooterMark, useSettings } from '~/stores/settings';

import { DarkScopeStyles } from './DarkScope';
import { DARK_SCOPE } from './darkScopeProps';
import { NAV } from './nav';
import { VariantMenu } from './VariantMenu';

import classes from './SiteFooter.module.css';

const WORDMARK = CLUB.name.split(' ').at(0);
const { email } = CLUB;

const Decor: FC<{ mark: FooterMark }> = ({ mark }) => {
  switch (mark) {
    case FooterMark.enum.none:
      return null;
    case FooterMark.enum.outline:
      return <ClubLogo mark height={420} className={classes.outline} />;
    case FooterMark.enum.wordmark:
      return (
        <div className={classes.wordmark} aria-hidden>
          {WORDMARK}
        </div>
      );
    default:
      return <div className={`${classes.shuttle} ${classes[mark]}`} aria-hidden />;
  }
};

export const SiteFooter = memo(() => {
  const { i18n, t } = useLingui();
  const footerMark = useSettings((s) => s.footerMark);

  return (
    <footer className={classes.footer} {...DARK_SCOPE}>
      <DarkScopeStyles />
      <Decor mark={footerMark} />
      <Container size="lg" className={classes.grid}>
        <Stack gap={8} className={classes.brand}>
          <ClubLogo height={120} className={classes.logo} />
          <Text fw={700}>{CLUB.name}</Text>
          <Text size="sm" c="dimmed">
            <AddressLink />
          </Text>
          <Text size="sm" c="dimmed">
            <Trans>
              Contact:{' '}
              <Anchor href={`mailto:${email}`} size="sm">
                {email}
              </Anchor>
            </Trans>
          </Text>
          <Text size="sm" c="dimmed">
            <Trans>Org. no. {CLUB.orgNr}</Trans>
          </Text>
          <SocialLinks className={classes.social} />
        </Stack>

        <nav aria-label={t`Footer menu`} className={classes.links}>
          <Stack gap={6}>
            {NAV.map((item) => (
              <Anchor key={item.to} component={Link} to={item.to} size="sm" c="inherit">
                {i18n._(item.label)}
              </Anchor>
            ))}
            <Anchor component={Link} to="/medlemskap/bli-medlem" size="sm" c="inherit">
              <Trans>Join the club</Trans>
            </Anchor>
          </Stack>
        </nav>

        <Stack gap={6} className={classes.links}>
          <Anchor href={CLUB.memberLoginUrl} target="_blank" size="sm" c="inherit">
            <Trans>My membership</Trans> <ArrowUpRight className={classes.ext} />
          </Anchor>
          <Anchor component={Link} to="/klubben" hash="varsling" size="sm" c="inherit">
            <Trans>Report a concern</Trans>
          </Anchor>
          <Anchor component={Link} to="/klubben" hash="personvern" size="sm" c="inherit">
            <Trans>Privacy</Trans>
          </Anchor>
        </Stack>

        <Stack gap={8} className={classes.variants}>
          <Text size="sm" fw={600}>
            <Trans>Concept preview</Trans>
          </Text>
          <Text size="xs" c="dimmed">
            <Trans>Switch color, shape, size, menu and width to compare design variants.</Trans>
          </Text>
          <VariantMenu />
          <Anchor component={Link} to="/studie/404" size="sm">
            <Trans>404 ideas</Trans>
          </Anchor>
        </Stack>
      </Container>
    </footer>
  );
});
