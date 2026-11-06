import { Alert, Table, Title } from '@mantine/core';
import { PortableText, type PortableTextComponents, type PortableTextTypeComponent } from '@portabletext/react';
import { memo } from 'react';

import type { ArticleBlocks, CmsImageData } from '~/cms/content';
import { CmsImage, Info } from '~/components/ui';

import classes from './ArticleBody.module.css';

const CALLOUT_ICON = <Info width={22} height={22} />;

const Callout: PortableTextTypeComponent<{ _type: 'callout'; title?: string; text: string }> = ({ value }) => (
  <Alert variant="light" radius="lg" icon={CALLOUT_ICON} title={value.title} className={classes.callout}>
    {value.text}
  </Alert>
);

const Quote: PortableTextTypeComponent<{ _type: 'quote'; text: string; cite?: string }> = ({ value }) => (
  <figure className={classes.quote}>
    <blockquote>{value.text}</blockquote>
    {value.cite && <figcaption>{value.cite}</figcaption>}
  </figure>
);

const IMAGE_SIZES = '(min-width: 48em) 720px, 100vw';

type InlineImageValue = Pick<CmsImageData, 'asset' | 'hotspot' | 'crop'> & { _type: 'image'; alt?: string };

const InlineImage: PortableTextTypeComponent<InlineImageValue> = ({ value: { asset, hotspot, crop, alt } }) => (
  <CmsImage
    image={{ asset, hotspot, crop, alt: alt ?? '', lqip: undefined }}
    sizes={IMAGE_SIZES}
    decorative={!alt}
    radius="lg"
    className={classes.image}
  />
);

type TableValue = { _type: 'table'; caption?: string; rows?: { _key: string; cells?: string[] }[] };

const TABLE_MIN_WIDTH = 560;

const ArticleTable: PortableTextTypeComponent<TableValue> = ({ value: { caption, rows = [] } }) => {
  const [head, ...body] = rows;
  if (!head) return null;
  return (
    <Table.ScrollContainer minWidth={TABLE_MIN_WIDTH} className={classes.table}>
      <Table withTableBorder withColumnBorders striped verticalSpacing="xs">
        {caption && <Table.Caption>{caption}</Table.Caption>}
        <Table.Thead>
          <Table.Tr>
            {head.cells?.map((cell, i) => (
              <Table.Th key={i}>{cell}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {body.map((row) => (
            <Table.Tr key={row._key}>
              {row.cells?.map((cell, i) => (
                <Table.Td key={i} className={classes.cell}>
                  {cell}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

const COMPONENTS: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className={classes.paragraph}>{children}</p>,
    h2: ({ children }) => (
      <Title order={2} className={classes.heading}>
        {children}
      </Title>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className={classes.list}>{children}</ul>,
  },
  types: { callout: Callout, quote: Quote, image: InlineImage, table: ArticleTable },
};

export const ArticleBody = memo<{ blocks: ArticleBlocks }>(({ blocks }) => (
  <div className={classes.body}>
    <PortableText value={blocks} components={COMPONENTS} />
  </div>
));
