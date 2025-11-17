export interface MatchDTO {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  startAt: string;
  odds: Record<string, number>;
}
