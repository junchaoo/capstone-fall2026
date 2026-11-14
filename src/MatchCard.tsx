import type { MatchSummary } from './match';
import SummonersRiftMatchCard from './SummonersRiftMatchCard';
import ArenaMatchCard from './ArenaMatchCard';

export default function MatchCard({ match }: { match: MatchSummary })
{
  switch (match.kind)
  {
    case 'arena':
      return <ArenaMatchCard match={match} />;
    case 'summonersRift':
      return <SummonersRiftMatchCard match={match} />;
    default:
      return <p className="match-history__status--error">Unknown match type</p>;
  }
}