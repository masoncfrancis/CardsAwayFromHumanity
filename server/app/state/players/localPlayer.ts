import { Room, RoomBase, RoomKeys } from "../room";
import { HostedRoom } from "../hostedRoom";
import { Events, Commands, PlayerLocation } from "../../../../client/shared/events";
import { redisClient, redisPublisher, subscribeRedis, unsubscribeRedis } from "../../lib/redis";
import { Session } from "../session";
import { Player, PlayerMessage, PlayerKeys } from "./player";
import { eventEmitter } from "../../lib/event";
import { PlayerCommands } from "./proxyPlayer";
import { state } from "../state";



export class LocalPlayer implements Player {

    isHost: boolean = false
    session?: Session

    hostedRoom?: Room
    joinedRoom?: Room
    ready: Promise<void>

    constructor(public id: string, public name: string) {

        let key = `user:${id}`

        void redisClient.multi()
            // Create the player, expire it in four hours
            .hSet(key, {
                [PlayerKeys.id]: id,
                [PlayerKeys.name]: name,
                [PlayerKeys.hosted]: String(true)
            })
            .expire(key, 60 * 60 * 4)
            .exec()

        // Set listeners

        let channelName = `events:to:${key}`

        console.log(channelName)

        this.broadcastDelete()

        eventEmitter.on(channelName, this.onMessage)
        this.ready = subscribeRedis(channelName)

    }

    onMessage = (message: PlayerMessage) => {
        console.log(message)
        switch (message.type) {
            case PlayerCommands.sendEvent:
                this.sendEvent(message.payload.event, ...message.payload.payload)
                break
            case PlayerCommands.successfullyJoined:
                RoomBase.getRoom(message.payload.code).then((room) => {
                    this.successfullyJoinedRoom(room, message.payload.isHost)
                }).catch((err) => {
                    console.error("Error finding room in remote join: ", err)
                })
            case PlayerCommands.delete:

                let key = `user:${this.id}`
                let channelName = `events:to:${key}`

                console.log("Got Proxy delete command for id:" + this.id)
                eventEmitter.off(channelName, this.onMessage)
                void unsubscribeRedis(channelName)
                delete state.players[this.id]
        }
    }

    host(password?: string) {

        // Should we block hosting a new game? Probably not

        // if (this.isHost) {
        //     this.session?.emit(Events.alreadyHosting)
        //     return
        // }

        this.isHost = true

        let room = new HostedRoom(this, password, undefined, (success, code) => {
            if (!success) {
                this.session?.emit(Events.roomCreationFailed)
                this.isHost = false
                return
            }
            this.session?.emit(Events.roomCreated, code)

            this.hostedRoom = room

        })

    }

    async attemptJoining(payload: Record<string, string>) {

        let code = payload.gameId.toUpperCase()

        if (code.length != 4 || /[^A-Z]/.test(code)) {
            console.debug("Invalid room code " + code)
            this.sendEvent(Events.invalidRoomCode)
            return
        }

        try {
            const value = await redisClient.hGetAll(`room:${code}`)
            if (Object.keys(value).length === 0) {
                this.sendEvent(Events.invalidRoomCode)
                return
            }

            if (payload.action == Commands.spectate) {
                this.spectate(code)
                return
            }

            if (value[RoomKeys.passwordProtected] == String(false)) {
                this.joinRoom(code)
                return
            }

            // Password protected!
            if (payload.password == null) {
                this.sendEvent(Events.passwordNeeded)

            } else if (value[RoomKeys.password] !== payload.password) {
                // Bad way to prevent bruteforce
                setTimeout(() => {
                    this.sendEvent(Events.invalidPassword)
                }, 1500)

            } else {
                // Good to go
                this.joinRoom(code, payload.password)
            }

        } catch (error) {
            this.sendEvent(Events.invalidRoomCode)
        }

    }

    private checkRoom(room: String) {

    }

    private joinRoom(roomCode: string, password?: string) {

        this.leaveRoom()
        this.isHost = false

        RoomBase.getRoom(roomCode)
            .then((room) => {

                room.tryJoining(this)

            })
            .catch((error) => {
                this.sendEvent(Events.cannotJoin)
            })
    }

    private spectate(roomCode: string) {

        this.leaveRoom()
        this.isHost = false

        RoomBase.getRoom(roomCode)
            .then((room) => {
                this.joinedRoom = room
                room.spectate(this)
                this.session?.watchRoom(room)
                this.setLocation(PlayerLocation.spectating, room.roomCode)
            })
            .catch((error) => {
                this.sendEvent(Events.cannotJoin)
            })
    }

    successfullyJoinedRoom(room: Room, isHost: boolean) {
        this.joinedRoom = room
        this.session?.watchRoom(room)
        this.sendEvent(Events.joinedGame, room.roomCode, isHost)
        this.setLocation(PlayerLocation.inGame, room.roomCode)
    }

    private leaveRoom() {
        this.joinedRoom?.playerLeft(this)
        this.joinedRoom = undefined
    }

    sendEvent(event: string, ...args: any[]) {
        this.session?.emit(event, ...args)
    }

    connect(session: Session) {
        // To avoid multiple tabs logged in as the same user
        this.session?.forceEnd()
        this.session = session
    }

    onDisconnect(session: Session) {
        if (session == this.session) {
            this.leaveRoom()
            delete state.players[this.id]
        }
    }

    setLocation(location: PlayerLocation, room?: string) {
        let key = `user:${this.id}`

        let payload: string[] = [
            PlayerKeys.location, location
        ]

        if (room !== undefined) {
            payload.push(PlayerKeys.room, room)
        }

        void redisClient.hSet(key, Object.fromEntries(
            Array.from({ length: payload.length / 2 }, (_, index) => [payload[index * 2], payload[index * 2 + 1]])
        ))
    }

    async reloadState(): Promise<{location:PlayerLocation, room?: string}> {
        const values = await redisClient.hGetAll(`user:${this.id}`)
        const location = values[PlayerKeys.location] as PlayerLocation
        const result = { location, room: values[PlayerKeys.room] }

        if (location === PlayerLocation.inGame) {
            this.joinRoom(values[PlayerKeys.room])
        } else if (location === PlayerLocation.spectating) {
            this.spectate(values[PlayerKeys.room])
        }

        return result
    }

    disconnect() {
        console.debug("Saving Player State: " + this.id)

        void redisClient.multi()
            .hSet(`user:${this.id}`, { [PlayerKeys.hosted]: String(false) })
            .exec()

        this.broadcastDelete()
    }

    broadcastDelete() {
        let key = `user:${this.id}`
        let message = new PlayerMessage(PlayerCommands.delete, {})

        void redisPublisher.publish(`events:from:${key}`, JSON.stringify(message))
        void redisPublisher.publish(`events:to:${key}`, JSON.stringify(message))
    }
}
