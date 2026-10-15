import { createClient } from "redis"
import { eventEmitter } from "./event"

const port = Number.parseInt(process.env.REDIS_PORT ?? "6379", 10)
const redisUrl = process.env.REDIS_URL ?? `redis://${process.env.REDIS_IP ?? "localhost"}:${port}`

export const redisSettings = redisUrl
export const redisClient = createClient({ url: redisUrl })
export const redisPublisher = redisClient.duplicate()
export const redisSubscriber = redisClient.duplicate()

export async function connectRedis(): Promise<void> {
    await Promise.all([
        redisClient.connect(),
        redisPublisher.connect(),
        redisSubscriber.connect()
    ])
}

export async function subscribeRedis(channel: string): Promise<void> {
    await redisSubscriber.subscribe(channel, (message) => {
        try {
            eventEmitter.emit(channel, JSON.parse(message))
        } catch (error) {
            console.error(`Invalid Redis message on ${channel}:`, error)
        }
    })
}

export async function unsubscribeRedis(channel: string): Promise<void> {
    await redisSubscriber.unsubscribe(channel)
}

export async function closeRedis(): Promise<void> {
    await Promise.all([
        redisSubscriber.quit(),
        redisPublisher.quit(),
        redisClient.quit()
    ])
}

for (const client of [redisClient, redisPublisher, redisSubscriber]) {
    client.on("error", (error) => {
        console.error("Redis:", error)
    })
}
