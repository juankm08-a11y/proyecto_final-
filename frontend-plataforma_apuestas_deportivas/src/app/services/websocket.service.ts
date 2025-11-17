import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket$: WebSocketSubject<any> | null = null;
  private url =
    window.location.hostname === 'localhost'
      ? 'ws://localhost:8081/ws'
      : `ws://${window.location.hostname}:8081/ws`;

  constructor(private zone: NgZone) {}

  connect(): Observable<any> {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = webSocket(this.url);
    }
    return this.socket$.asObservable();
  }

  send(msg: any) {
    this.socket$?.next(msg);
  }

  close() {
    this.socket$?.complete();
    this.socket$ = null;
  }
}
