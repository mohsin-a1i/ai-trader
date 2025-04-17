export interface LinkedListNode<T> {
    value: T
    previous: LinkedListNode<T> | null
    next: LinkedListNode<T> | null
}

type Compare<T> = (a: T, b:T) => number

export default class SortedLinkedList<T> {
    private start: LinkedListNode<T> | undefined
    private end: LinkedListNode<T> | undefined

    constructor(private compare: Compare<T>) {}

    get maxValue() {
        return this.end?.value
    }

    get minValue() {
        return this.start?.value
    }

    insertValue(value: T) {
        const node = { value, previous: null, next: null }

        if (!this.end) {
            this.start = node
            return this.end = node
        } 

        return this.insertNode(node, this.end)
    }

    insertNode(node: LinkedListNode<T>, current: LinkedListNode<T>): LinkedListNode<T> {
        if (this.compare(node.value, current.value) < 0) {
            const previous = current.previous

            if (previous === null) {
                node.next = current
                current.previous = node
                return this.start = node
            }

            if (this.compare(node.value, previous.value) < 0) return this.insertNode(node, previous)

            node.next = current
            node.previous = previous
            previous.next = node
            return current.previous = node
        } else {
            const next = current.next

            if (next === null) {
                node.previous = current
                current.next = node
                return this.end = node
            }

            if (this.compare(node.value, next.value) > 0) return this.insertNode(node, next)

            node.next = next
            node.previous = current
            next.previous = node
            return current.next = node
        }
    }

    removeNode(node: LinkedListNode<T>) {
        const previous = node.previous
        const next = node.next

        if (next) next.previous = previous
        if (previous) previous.next = next
    }
}