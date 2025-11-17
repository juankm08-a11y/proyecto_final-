import { Component, Input } from '@angular/core';
import { Match } from '../../models/match.model';
import {
  CommonModule,
  NgIf,
} from '../../../../node_modules/@angular/common/common_module.d-NEF7UaHr';

@Component({
  selector: 'app-match-card',
  imports: [NgIf, CommonModule],
  templateUrl: './match-card.component.html',
  styleUrl: './match-card.component.scss',
})
export class MatchCardComponent {
  @Input() match!: Match;
}
