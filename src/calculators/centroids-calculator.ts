import { Trade } from "../clients/alpaca"

export default class CentroidsCalculator {
  calculate(trades: Trade[]) {
    const trade = trades[0]
    if (!trade) return

    const maxDistance = 0.3
    const groups: number[][] = [[trade.p]]
    const centroids: number[] = [trade.p]
    const volumes: number[] = [trade.s]

    for (let i = 1; i < trades.length; i++) {
      const trade = trades[i]

      let closetCentroidIndex
      let minDistance = Infinity
      for (let i = 0; i < centroids.length; i++) {
        const distance = Math.abs(trade.p - centroids[i])
        if (distance < maxDistance && distance < minDistance) {
          minDistance = distance
          closetCentroidIndex = i
        }
      }

      if (closetCentroidIndex === undefined) {
        groups.push([trade.p])
        centroids.push(trade.p)
        volumes.push(trade.s)
      } else {
        groups[closetCentroidIndex].push(trade.p)
        centroids[closetCentroidIndex] = this.calculateMean(groups[closetCentroidIndex])
        volumes[closetCentroidIndex] += trade.s
      }
    }

    for (let i = 0; i < centroids.length; i++) console.log(centroids[i].toFixed(2) + ',' + volumes[i])
  }

  private calculateMean(numbers: number[]) {
    let sum = 0
    for (let i = 0; i < numbers.length; i++) sum += numbers[i]
    return sum / numbers.length
  }
}