import { Component, OnDestroy, OnInit } from '@angular/core';
import { Alert } from '../../models/alert.model';
import { Subscription } from 'rxjs';
import { AlertController } from '../../controllers/alert.controller';
import { CommonModule, NgForOf } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [NgForOf, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  alerts: Alert[] = [];
  subscription!: Subscription;

  constructor(private alertCtrl: AlertController) {}

  ngOnInit() {
    this.subscription = this.alertCtrl.listenAlerts().subscribe((alert) => {
      this.alerts.unshift(alert);
      if (this.alerts.length > 10) this.alerts.pop();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
