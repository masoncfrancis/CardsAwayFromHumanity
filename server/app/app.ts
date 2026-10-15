import {onConnection} from "./socket/connectionHandler";
import { createAdapter as redisAdapter } from "@socket.io/redis-adapter";
import { connectRedis, closeRedis, redisPublisher, redisSubscriber } from "./lib/redis";
import { io, server } from "./lib/io";
import { state } from "./state/state";

async function start() {
    await connectRedis()
    io.adapter(redisAdapter(redisPublisher, redisSubscriber))
    io.on("connection", onConnection)
    await new Promise<void>((resolve) => {
        server.listen(process.env.PORT || 3000, () => resolve())
    })
    console.log("Howdy earth")
}

async function shutdown(signal: string) {
    console.log(`${signal}, cleaning up`)
    await state.destroyAll()
    await closeRedis()
    io.close()
    process.exit(0)
}

process.once("SIGINT", () => { void shutdown("Interrupt signal") })
process.once("SIGTERM", () => { void shutdown("Termination signal") })

void start().catch((error) => {
    console.error("Failed to start server:", error)
    process.exitCode = 1
})
