import { Player } from "../state/players/player"
import { Events, Commands } from "../../../client/shared/events"
import { Socket } from "socket.io";
import { Session } from "../state/session";

export function onConnection(socket: Socket) {
    console.debug("Hello!")

    var session: Session | undefined = undefined

    socket.on('disconnect', function () {
        console.debug("Goodbye!")
        session?.onDisconnect()
    })

    socket.on(Commands.authenticate, async function (data, callback: Function) {

        try {
            if (session !== undefined) {
                return
            }

            let player = Player.authenticate(data)

            if (player == undefined) {
                socket.emit(Events.invalidUsername)
                return
            }

            await player.ready
            session = new Session(socket, player)
            callback(player.id)
        } catch (err) {
            console.error(err)
            socket.emit(Events.unknownError)
        }

    })
    socket.on(Commands.rejoin, async function (data, callback: Function) {


        try {
            if (session !== undefined) {
                return
            }

            console.log("Player Rejoined: " + data.id)

            let player = Player.authenticate(data)

            if (player == undefined) {
                socket.emit(Events.invalidUsername)
                return
            }

            await player.ready
            const location = await player.reloadState()
            session = new Session(socket, player)
            callback(player.id, location.location, location.room)

        } catch (err) {
            console.error(err)
            socket.emit(Events.unknownError)
        }

    })
}
