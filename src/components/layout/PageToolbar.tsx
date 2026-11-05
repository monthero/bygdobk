import { Container } from '@mantine/core';
import { useEffect, useRef, useState, type FC, type ReactNode } from 'react';

import { useStandaloneNav } from '~/hooks/useStandaloneNav';

import { PageTitle } from './PageTitle';

import classes from './PageToolbar.module.css';

export const PageToolbar: FC<{ children: ReactNode }> = ({ children }) => {
  const standalone = useStandaloneNav();
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!standalone || !el) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
      if (entry) setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [standalone]);

  return (
    <>
      <div ref={sentinel} aria-hidden />
      <div className={classes.toolbar} data-bk="toolbar" data-stuck={(standalone && stuck) || undefined}>
        <Container>
          <div className={classes.inner}>
            {standalone && (
              <div className={classes.title} aria-hidden={!stuck}>
                <PageTitle />
              </div>
            )}
            {children}
          </div>
        </Container>
      </div>
    </>
  );
};
