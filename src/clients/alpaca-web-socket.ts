import RequestBuilder from "./request-builder"
import * as WebSocket from 'ws'

export interface Trade {
  T: 't'
  S: string //symbol
  c: string[]
  i: number
  p: number // price
  s: number // size
  t: string // time
  x: string // 
  z: string // C for nasdaq
}

export class AlpacaWebSocket {
  private url = "wss://stream.data.alpaca.markets/v2/iex"
  private socket: WebSocket
  private authenticated = false

  constructor(symbols: string[], onTrade: (trade: Trade) => void) {
    this.socket = new WebSocket(this.url);

    this.socket.on('open', () => {
      this.socket.send(JSON.stringify({
        action: 'auth',
        key: process.env.ALPACA_KEY_ID,
        secret: process.env.ALPACA_SECRET_KEY
      }))
    })

    this.socket.on('message', (data) => {
      const messages = JSON.parse(data.toString());

      for (const message of messages) {
        if (!this.authenticated) {
          if (message.T !== "success") return
          this.authenticated = true

          return this.socket.send(JSON.stringify({
            action: 'subscribe',
            trades: symbols,
          }))
        }

        if (message.T === "t") return onTrade(message)
      }
    });

    this.socket.on('error', (err) => {
      console.error('Alpaca webSocket error:', err.message);
    })

    this.socket.on('close', () => {
      console.log('Alpaca webSocket closed');
    })
  }

  close() {
    this.socket.close(0)
  }
}