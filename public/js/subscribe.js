async function main() {
    const topics = ["nvidia-price"]
    let elements = {}
    for (const topic of topics) elements[topic] = document.getElementById(topic)

    const registration = await navigator.serviceWorker.register('/js/notification-worker.js')
    await navigator.serviceWorker.ready

    const { endpoint, settings } = await getDevice(registration)
    for (const [topic, value] of Object.entries(settings)) elements[topic].checked = value

    for (const [topic, element] of Object.entries(elements)) {
        element.addEventListener("change", async () => {
            await request("PATCH", "/api/notifications/settings", { endpoint }, { [topic]: element.checked })
        })
    }

    const testNotificationButton = document.getElementById('test-notification')
    testNotificationButton.addEventListener('click', async () => {
        await request('GET', '/api/notifications/test')
    })
}
main()

async function getDevice(registration) {
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return await registerDevice(registration)

    try {
        const settings = await request('GET', 'api/notifications/settings', { endpoint: subscription.endpoint })
        return { endpoint: subscription.endpoint, settings }
    } catch (error) {
        await subscription.unsubscribe()
        return await registerDevice(registration)
    }
}

async function registerDevice(registration) {
    const { publicKey } = await request('GET', '/api/notifications/credentials')
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
    })

    const settings = await request('POST', 'api/notifications/register', null, {
        endpoint: subscription.endpoint,
        keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
            auth: arrayBufferToBase64(subscription.getKey("auth")),
        },
        encoding: PushManager.supportedContentEncodings
    })

    return { endpoint: subscription.endpoint, settings }
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (const b of bytes) binary += String.fromCharCode(b)
    return btoa(binary)
}

async function request(method, path, query, body) {
    if (query) path += '?' + new URLSearchParams(query).toString()
    const options = { method }
    if (body) {
        options.body = JSON.stringify(body)
        options.headers = { 'Content-Type': 'application/json' }
    }
    const response = await fetch(path, options)
    
    const json = await getJSON(response)
    if (response.ok) return json
    throw new Error(json?.message || response.statusText)
}

async function getJSON(response) {
    try {
        return await response.json()
    } catch (error) {}
}

