import { generateVAPIDKeys, setVapidDetails, sendNotification, PushSubscription, VapidKeys } from 'web-push'

export type Topic = "nvidia-price"

interface Device {
    settings: Record<Topic, boolean>,
    subscription: PushSubscription
}

export default class Notifier {
    private devices: Record<string, Device> = {}
    private keys: VapidKeys
    private timeout: number = 5000
    private lastNotificationTime: number = 0

    constructor() {
        this.keys = generateVAPIDKeys()
        setVapidDetails(`mailto:${process.env.EMAIL}`, this.keys.publicKey, this.keys.privateKey)
    }

    get credentials() {
        return { publicKey: this.keys.publicKey }
    }

    getDeviceSettings(endpoint: string) {
        const device = this.devices[endpoint]
        if (!device) throw new Error('Device not registered')
        return device.settings
    }

    updateDeviceSettings(endpoint: string, update: Record<Topic, boolean>) {
        const device = this.devices[endpoint]
        if (!device) throw new Error('Device not registered')
        device.settings = { ...device.settings, ...update }
        return device.settings
    }

    addDevice(subscription: PushSubscription) {
        if (this.devices[subscription.endpoint]) throw new Error('Device already registered')
        const settings = { "nvidia-price": true }
        this.devices[subscription.endpoint] = { settings, subscription }
        return settings
    }

    removeDevice(endpoint: string) {
        if (!this.devices[endpoint]) throw new Error('Device not registered')
        delete this.devices[endpoint]
    }

    async send(topic: Topic, title: string, body: string) {
        const time = new Date().getTime()
        if (time - this.lastNotificationTime < this.timeout) return
        this.lastNotificationTime = time

        const devices = Object.values(this.devices)
        for (const { settings, subscription } of devices) {
            if (settings[topic]) await sendNotification(subscription, JSON.stringify({ title, body }))
        }
    }

    async test() {
        const devices = Object.values(this.devices)
        for (const { subscription } of devices) {
            await sendNotification(subscription, JSON.stringify({ 
                title: 'Test Notification',
                body:  'This notification was generated to test your device'
            }))
        }
    }
}