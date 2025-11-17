import { Match } from '../models/match.model';

export class MatchMapper {
  static fromApi(raw: any): Match {
    return {
      id: raw.id || raw.matchId || `${raw.home}-${raw.away}`,
      homeTeam: raw.homeTeam || raw.home || raw.home_team || 'Home',
      awayTeam: raw.awayTeam || raw.away || raw.away_team || 'Away',
      startAt:
        raw.startAt || raw.start_at || raw.start || new Date().toISOString(),
      odds: raw.odds || raw.currentOdds || {},
    } as Match;
  }

  static toApi(model: Match) {
    return {
      matchId: model.id,
      homeTeam: model.homeTeam,
      awayTeam: model.awayTeam,
      startAt: model.startAt,
      odds: model.odds,
    };
  }
}
