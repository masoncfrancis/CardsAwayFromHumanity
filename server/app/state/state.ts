import { Room } from "./room";
import { Player } from "./players/player";
import { LocalPlayer } from "./players/localPlayer";
import { redisClient } from "../lib/redis";
import { HostedRoom } from "./hostedRoom";

// clean every 60 seconds
const cleanInterval = 60000

class State {


    constructor() {
        // setInterval(() => {
        //     this.cleanPlayers()
        // }, cleanInterval);
    }

    rooms:  { [key: string]: Room } = {}
    players:  { [key: string]: Player } = {}

    cleanPlayers() {

        const cutoff = new Date().getTime() - cleanInterval

        Object.keys(this.players).map((key) => {
            try {
                let value = this.players[key] 
                if (value instanceof LocalPlayer) {
                    // TODO: clean up proxys
                    delete this.players[key] 
                }
            } catch (err) {
                console.error(err)
            }
        })
    }

    async destroyAll(): Promise<void> {
        const multi = redisClient.multi()

        Object.keys(this.players).forEach((key) => {
            try {
                const value = this.players[key]
                if (value instanceof LocalPlayer) (value as LocalPlayer).disconnect()
            } catch (error) {
                console.error(error)
            }
        })

        Object.keys(this.rooms).forEach((key) => {
            try {
                const value = this.rooms[key]
                if (value instanceof HostedRoom) (value as HostedRoom).disconnect()
            } catch (error) {
                console.error(error)
            }
        })

        await multi.exec()
    }
}



export var state = new State()
