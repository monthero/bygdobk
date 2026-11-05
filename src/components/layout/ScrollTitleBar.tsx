import { Container } from '@mantine/core';
import { useEffect, useState, type FC } from 'react';

import { PageTitle } from './PageTitle';

import classes from './ScrollTitleBar.module.css';

const SHOW_AFTER = 200;

export const ScrollTitleBar: FC = () => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const update = () => setShown(window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className={classes.bar} data-shown={shown || undefined} aria-hidden={!shown}>
      <Container className={classes.inner}>
        <PageTitle />
      </Container>
    </div>
  );
};
