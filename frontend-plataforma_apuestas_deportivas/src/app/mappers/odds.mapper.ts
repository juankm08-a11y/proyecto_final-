import { OddsDto } from '../dto/odds.dto';
import { Odds } from '../models/odds_model';

export class OddsMapper {
  static fromApi(model: Odds): OddsDto {
    return {
      matchId: model.matchId,
      newOdds: model.newOdds,
    };
  }

  static fromDTO(raw: any): Odds {
    return {
      matchId: raw.matchId || raw.match_id,
      newOdds: raw.newOdds || raw.new_odds,
    };
  }
}
