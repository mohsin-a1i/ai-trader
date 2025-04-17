export default class MovingAverageCalculator {
    private window?: number[]
    private _average: number = 0

    constructor(private windowSize: number) {}

    get average() {
        return this._average
    }

    add(value: number) {
        const d = value / this.windowSize

        if (this.window === undefined) {
            this.window = new Array(this.windowSize).fill(d)
            this._average = value
        } else {
            this.window.push(d)
            this._average += d - (this.window.shift() as number)
        }
    }
}