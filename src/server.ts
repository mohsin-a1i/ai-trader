import * as path from 'path'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import Notifier, { Topic } from './notifier'
import { PushSubscription } from 'web-push'
import { AlpacaWebSocket } from './clients/alpaca-web-socket'
import RollingDistanceCalculator from './calculators/rolling-distance-calculator'


const notifier = new Notifier()
const distanceCalculator = new RollingDistanceCalculator()
let previousDistance = 0

new AlpacaWebSocket(['NVDA'], (trade) => {
  const distance = distanceCalculator.add(trade.p)
  if (distance - previousDistance > 0.3) notifier.send('nvidia-price', 'Nvidia Spiked', `Nvidia is trading at ${trade.p}`)
  previousDistance = distance
})

const fastify = Fastify()
fastify.register(fastifyStatic, { 
  root: path.join(__dirname, '../public')
})

fastify.get('/api/notifications/credentials', async (request, reply) => {
  reply.code(200).send(notifier.credentials)
})

fastify.get('/api/notifications/test', async (request, reply) => {
  await notifier.test()
  return reply.code(200).send()
})

fastify.get<{
  Querystring: { endpoint: string }
}>('/api/notifications/settings', async (request, reply) => {
  const { endpoint } = request.query
  const settings = notifier.getDeviceSettings(endpoint)
  return reply.code(200).send(settings)
})

fastify.patch<{
  Querystring: { endpoint: string }
  Body: Record<Topic, boolean>
}>('/api/notifications/settings', async (request, reply) => {
  const { endpoint } = request.query
  const settings = notifier.updateDeviceSettings(endpoint, request.body)
  reply.code(200).send(settings)
})

fastify.post<{
  Body: PushSubscription
}>('/api/notifications/register', async (request, reply) => {
  const settings = notifier.addDevice(request.body)
  reply.code(201).send(settings)
})

fastify.delete<{
  Querystring: { endpoint: string }
}>('/api/notifications/unregister', async (request, reply) => {
  const { endpoint } = request.query
  notifier.removeDevice(endpoint)
  reply.code(200).send()
})

fastify.listen({ port: 3000 }, err => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }

  console.log('🚀 Server running at http://localhost:3000')
})
