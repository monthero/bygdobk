import type { Pair, Session, Settings } from '../model.ts';
import { Partners, PlayStyle } from '../model.ts';

export type Entrant = { id: string; playerIds: string[] };

type Lineup = Pick<Session, 'settings' | 'players' | 'pairs'>;

export const isFixedPairs = (settings: Settings): boolean =>
  settings.style === PlayStyle.enum.doubles && settings.partners === Partners.enum.fixed;

export const entrantsPerMatch = (settings: Settings): number =>
  settings.style === PlayStyle.enum.singles || isFixedPairs(settings) ? 2 : 4;

const pairId = ([first, second]: Pair): string => `${first}+${second}`;

export const entrantsOf = ({ settings, players, pairs }: Lineup): Entrant[] => {
  if (isFixedPairs(settings)) {
    return pairs.map((pair) => ({ id: pairId(pair), playerIds: [...pair] }));
  }
  return players.map((player) => ({ id: player.id, playerIds: [player.id] }));
};

export const sideResolver = (entrants: Entrant[]): ((side: string[]) => string[]) => {
  const byPlayer = new Map(entrants.flatMap((entrant) => entrant.playerIds.map((id) => [id, entrant.id] as const)));
  return (side) =>
    Array.from(
      new Set(
        side
          .values()
          .map((playerId) => byPlayer.get(playerId))
          .filter((id): id is string => id !== undefined),
      ),
    );
};
