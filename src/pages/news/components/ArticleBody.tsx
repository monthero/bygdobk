import { useLingui } from '@lingui/react/macro';
import { Alert, Title } from '@mantine/core';
import { memo } from 'react';

import { Info } from '~/components/ui';
import { BlockType, type NewsBlock } from '~/data/news';

import classes from './ArticleBody.module.css';

const CALLOUT_ICON = <Info width={22} height={22} />;

const Block = memo<{ block: NewsBlock }>(({ block }) => {
  const { i18n } = useLingui();
  switch (block.type) {
    case BlockType.enum.paragraph:
      return <p className={classes.paragraph}>{i18n._(block.text)}</p>;
    case BlockType.enum.heading:
      return (
        <Title order={2} className={classes.heading}>
          {i18n._(block.text)}
        </Title>
      );
    case BlockType.enum.list:
      return (
        <ul className={classes.list}>
          {block.items.map((item) => (
            <li key={item.id}>{i18n._(item)}</li>
          ))}
        </ul>
      );
    case BlockType.enum.callout:
      return (
        <Alert
          variant="light"
          radius="lg"
          icon={CALLOUT_ICON}
          title={block.title && i18n._(block.title)}
          className={classes.callout}
        >
          {i18n._(block.text)}
        </Alert>
      );
    case BlockType.enum.quote:
      return (
        <figure className={classes.quote}>
          <blockquote>{i18n._(block.text)}</blockquote>
          {block.cite && <figcaption>{i18n._(block.cite)}</figcaption>}
        </figure>
      );
  }
});

export const ArticleBody = memo<{ blocks: NewsBlock[] }>(({ blocks }) => (
  <div className={classes.body}>
    {blocks.map((block, i) => (
      <Block key={`${block.type}-${i}`} block={block} />
    ))}
  </div>
));
