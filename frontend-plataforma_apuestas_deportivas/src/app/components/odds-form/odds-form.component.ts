import { Component, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { OddsController } from '../../controllers/odds.controller';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-odds-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './odds-form.component.html',
  styleUrl: './odds-form.component.scss',
})
export class OddsFormComponent {
  @Input() matchId!: string;
  form: FormGroup;

  constructor(private fb: FormBuilder, private oddsCtrl: OddsController) {
    this.form = this.fb.group({
      newOdds: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.valid) {
      this.oddsCtrl
        .updateOdds(this.matchId, this.form.value.newOdds)
        .subscribe({
          next: (res) => alert('Odds actualizadas!'),
          error: (err) => alert('Error al actualizar odds'),
        });
    }
  }
}
