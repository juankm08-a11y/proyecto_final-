import { Component, OnInit } from '@angular/core';
import { Match } from '../../models/match.model';
import { MatchController } from '../../controllers/match.controller';
import { MatchCardComponent } from '../../components/match-card/match-card.component';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-matches',
  imports: [MatchCardComponent, NgForOf],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss',
})
export class MatchesComponent implements OnInit {
  matches: Match[] = [];

  constructor(private matchCtrl: MatchController) {}

  ngOnInit() {
    this.loadMatches();
  }

  loadMatches() {
    this.matchCtrl.getMatches().subscribe((data) => (this.matches = data));
  }
}
