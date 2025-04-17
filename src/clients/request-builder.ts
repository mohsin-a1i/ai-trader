import * as fs from 'fs'
import { URLSearchParams } from 'url'
import * as crypto from 'crypto'

type Headers = Record<string, string | undefined>
type Params = Record<string, string | undefined>
type Response = Record<string, any>

type Request = (path: string, params: Params, headers: Headers) => Promise<Response>
type Requests = (path: string, params: Params, headers: Headers) => Promise<void>

type DataSelector<T> = (response: Response) => T[]

export interface DateRange {
    start: Date
    end: Date
    setStart: (params: Params, start: Date) => void
    setEnd: (params: Params, end: Date) => void
}

export interface Pagination<T> {
    selectPageToken: (response: Response) => string
    setPageToken: (params: Params, token: string | undefined) => void
}

export default class RequestBuilder<T> {
    private cached: boolean = false
    private dataSelector: DataSelector<T> | null = null
    private dateRange: DateRange | null = null
    private pagination: Pagination<T> | null = null
    private data: T[] = []

    public setCached(cached: boolean) {
        this.cached = cached
        return this
    }

    public setDataSelector(dataSelector: DataSelector<T>) {
        this.dataSelector = dataSelector
        return this
    }

    public setDateRange(dateRange: Partial<DateRange>) {
        if (!dateRange.setStart) dateRange.setStart = (params, start) => params.start = start.toISOString()
        if (!dateRange.setEnd) dateRange.setEnd = (params, end) => params.end = end.toISOString()
        this.dateRange = dateRange as DateRange
        return this
    }

    public setPagination(pagination: Pagination<T>) {
        this.pagination = pagination
        return this
    }

    public async execute(path: string, params: Params = {}, headers: Headers = {}): Promise<T | T[]> {
        let request: Request | Requests = this.request.bind(this)
        if (this.pagination) request = this.paginatedRequest(request, this.pagination)
        if (this.dateRange) request = this.dateRangeRequest(request, this.dateRange)
        const body = await request(path, params, headers)
        return this.dataSelector ? this.data : body as T
    }

    private paginatedRequest(request: Request, pagination: Pagination<T>): Requests {
        return async (path: string, params: Params, headers: Headers) => {
            let token
            do {
                pagination.setPageToken(params, token)
                const response = await request(path, params, headers) 
                token = pagination.selectPageToken(response)    
            } while (token)
        }
    }

    private dateRangeRequest(request: Request | Requests, dateRange: DateRange): Requests {
        return async (path: string, params: Params, headers: Headers) => {
            const ranges = this.getDateRanges(dateRange.start, dateRange.end)
            for (const { start, end } of ranges) {
                dateRange.setStart(params, start)
                dateRange.setEnd(params, end)
                await request(path, params, headers)
            }
        }
    }

    private async request(path: string, params: Params, headers: Headers): Promise<Response> {
        const body = await this.cachedRequest(path, params, headers)

        if (this.dataSelector) {
            const data = this.dataSelector(body)
            if (data) this.data = this.data.concat(data)
        }

        return body
    }

    private async cachedRequest(path: string, params: Params, headers: Headers): Promise<Response> {
        if (this.cached) {
            const body = this.getCachedRequest(path, params)
            if (body) return body    
        }

        const response = await fetch(`${path}?${new URLSearchParams(this.removeUndefined(params))}`, { headers: this.removeUndefined(headers) })
        if (!response.ok) throw new Error(await response.text())

        const body = await response.json()
        if (this.cached) this.cacheRequest(path, params, body)
        return body
    }

    private getDateRanges(start: Date, end: Date) {
        const ranges = [];
        let currentDate = start

        while (currentDate < end) {
            const startOfDay = new Date(currentDate)
            startOfDay.setUTCHours(13, 30, 0, 0) // 9:30 AM New York Time (UTC-4)

            const endOfDay = new Date(currentDate) 
            endOfDay.setUTCHours(20) // 4:00 PM New York Time (UTC-4)

            ranges.push({ start: startOfDay, end: endOfDay })

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return ranges
    }

    private getCachedRequest(path: string, params: Params) {
        const cachePath = this.getCachePath(path, params)
        if (!fs.existsSync(cachePath)) return
        const data = fs.readFileSync(cachePath, 'utf8')
        return JSON.parse(data)
    }

    private cacheRequest(path: string, params: Params, response: JSON) {
        const cachePath = this.getCachePath(path, params)
        fs.writeFileSync(cachePath, JSON.stringify(response))
    }


    private getCachePath(path: string, params: Params): string {
        return `cache/${crypto.createHash('md5').update(`${path}?${new URLSearchParams(this.removeUndefined(params))}`).digest('hex')}`
    }

    private removeUndefined(object: Record<string, string | undefined>) {
        for (const [key, value] of Object.entries(object)) {
            if (value === undefined) delete object[key]
        }
        return object as Record<string, string>
    }
}