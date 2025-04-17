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

  constructor(private symbols: string[], onTrade: (trade: Trade) => void) {
    this.socket = new WebSocket(this.url);

    this.socket.on('message', (data) => {
      const messages = JSON.parse(data.toString());

      for (const message of messages) {
        if (message.T === "success") {
          if (message.msg === "connected") {
            console.log('Alpaca websocket connected')
            this.authenticate()
          } else if (message.msg === "authenticated") {
            console.log('Alpaca websocket authenticated')
            this.subscribe()
          }
        } else if (message.T === "subscription") {
          console.log('Alpaca websocket subscribed', message.trades)
        } else if (message.T === "t") {
          onTrade(message)
        }
      }
    })

    this.socket.on('error', (err) => {
      console.error('Alpaca websocket error:', err.message);
    })

    this.socket.on('close', () => {
      console.log('Alpaca websocket closed');
    })
  }

  private authenticate() {
    this.socket.send(JSON.stringify({
      action: 'auth',
      key: process.env.ALPACA_KEY_ID,
      secret: process.env.ALPACA_SECRET_KEY
    }))
  }

  private subscribe() {
    this.socket.send(JSON.stringify({
      action: 'subscribe',
      trades: this.symbols,
    }))
  }

  close() {
    this.socket.close(0)
  }
}