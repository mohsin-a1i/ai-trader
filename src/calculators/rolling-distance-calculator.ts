import SortedLinkedList, { LinkedListNode } from "../structures/sorted-linked-list"

export default class RollingDistanceCalculator {
  private window: LinkedListNode<number>[] = []
  private list = new SortedLinkedList<number>((a, b) => a - b)

  add(value: number) {
    const node = this.list.insertValue(value)
    this.window.push(node)

    if (this.window.length > 50) {
      const removedNode = this.window.shift() as LinkedListNode<number>
      this.list.removeNode(removedNode)
    }

    return (this.list.maxValue as number) - (this.list.minValue as number)
  }
}