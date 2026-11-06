import { Card, Stack, Text } from '@sanity/ui';
import type { CSSProperties, FC, ReactNode } from 'react';
import { useFormValue, type ImageValue, type ObjectInputProps } from 'sanity';

import { hotspotPosition, imageUrl } from '~/cms/images';
import { ARTICLE_HERO_ASPECT, NEWS_CARD_ASPECT } from '~/data/news';

import classes from './BannerInput.module.css';

const PREVIEW_WIDTH = 1440;
const CARD_WIDTH = 320;
const TITLE_PATH = ['title', 'nb'];
const CARD_FRAME_STYLE = { width: CARD_WIDTH, maxWidth: '100%' };
const CARD_IMAGE_STYLE = { aspectRatio: NEWS_CARD_ASPECT };

type PreviewProps = { label: string; children: ReactNode };

const Preview: FC<PreviewProps> = ({ label, children }) => (
  <Stack gap={2}>
    <Text size={1} weight="medium" muted>
      {label}
    </Text>
    {children}
  </Stack>
);

export const BannerInput: FC<ObjectInputProps<ImageValue>> = (props) => {
  const title = useFormValue(TITLE_PATH);
  const { asset, crop, hotspot } = props.value ?? {};
  if (!asset) return props.renderDefault(props);

  const heroStyle: CSSProperties = { aspectRatio: ARTICLE_HERO_ASPECT, objectPosition: hotspotPosition(hotspot) };
  return (
    <Stack gap={4}>
      {props.renderDefault(props)}
      <Preview label="Article banner">
        <Card className={classes.frame} radius={2} border>
          <img
            src={imageUrl({ asset, crop, hotspot }, PREVIEW_WIDTH)}
            alt=""
            className={classes.image}
            style={heroStyle}
          />
          <div className={classes.shade} />
          {typeof title === 'string' && (
            <Text size={3} weight="bold" className={classes.title}>
              {title}
            </Text>
          )}
        </Card>
      </Preview>
      <Preview label="News card">
        <Card className={classes.frame} radius={2} border style={CARD_FRAME_STYLE}>
          <img
            src={imageUrl({ asset, crop, hotspot }, CARD_WIDTH * 2, NEWS_CARD_ASPECT)}
            alt=""
            className={classes.image}
            style={CARD_IMAGE_STYLE}
          />
        </Card>
      </Preview>
    </Stack>
  );
};
