import './page.css';
import type { StyleKit } from '../types';
import { FlightDecor } from './FlightDecor';
import { FlightDivider } from './FlightDivider';
import { FlightHero } from './FlightHero';
import { FlightPageIntro } from './FlightPageIntro';
import { HowToJoin } from './HowToJoin';

export const flightKit: Partial<StyleKit> = {
  HomeHero: FlightHero,
  HomeExtra: HowToJoin,
  SectionDivider: FlightDivider,
  PageDecor: FlightDecor,
  PageIntro: FlightPageIntro,
};
