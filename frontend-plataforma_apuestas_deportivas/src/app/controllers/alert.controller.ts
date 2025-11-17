import { Injectable } from '@angular/core';
import { WebsocketService } from '../services/websocket.service';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Alert } from '../models/alert.model';
import { AlertMapper } from '../mappers/alert.mapper';

@Injectable({
  providedIn: 'root',
})
export class AlertController {
  constructor(private ws: WebsocketService) {}

  listenAlerts(): Observable<Alert> {
    return this.ws.connect().pipe(
      filter((msg: any) => msg?.event === 'alert'),
      map((msg: any) => AlertMapper.fromApi(msg.data))
    );
  }
}
