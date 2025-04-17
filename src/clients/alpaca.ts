import RequestBuilder from "./request-builder"

export interface Trade {
    c: string[]
    i: number
    p: number // price
    s: number // size
    t: string // time
    x: string // 
    z: string // C for nasdaq
}

export interface Quote {
    ap: number
    as: number
    ax: string
    bp: number
    bs: number
    bx: string
    c: string[]
    t: string
    z: string
}

export class Alpaca {
    private url = "https://data.alpaca.markets/v2/"
    private headers = {
        accept: 'application/json',
        'APCA-API-KEY-ID': process.env.ALPACA_KEY_ID!,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY!
    }

    public async getTrades(symbol: string, start: Date, end: Date) {
        return await this.getHistoricalDataRequest<Trade>(`stocks/${symbol}/trades`, start, end, response => response?.trades) as Trade[]
    }
    
    public async getQuotes(symbol: string, start: Date, end: Date) {
        return await this.getHistoricalDataRequest<Quote>(`stocks/${symbol}/quotes`, start, end, response => response?.quotes) as Quote[]
    }

    private async getDataRequest<T>(path: string) {
        return await new RequestBuilder<T>()
        .execute(this.url + path, this.headers)
    }

    private async getHistoricalDataRequest<T>(path: string, start: Date, end: Date, dataSelector: (response: any) => T[]) {
        return await new RequestBuilder<T>()
        .setDataSelector(dataSelector)
        .setPagination({
            selectPageToken: response => response.next_page_token,
            setPageToken: (params, token) => params.page_token = token
        }).setDateRange({ 
            start, end
        }).setCached(false)
        .execute(this.url + path, {
            limit: "10000",
            feed: 'iex',
            sort: 'asc'
        }, this.headers)
    }
}