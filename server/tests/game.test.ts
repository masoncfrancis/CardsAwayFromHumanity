import { beforeEach, describe, expect, it, vi } from "vitest"
import { GameCommand, GameEvents, GameStage } from "../../client/shared/events"

vi.mock("../app/state/hostedRoom", () => ({
    HostedRoom: class HostedRoom {}
}))

vi.mock("../app/state/players/player", () => ({
    Player: class Player {}
}))

import { CAFHGame } from "../app/state/game/CAFHGame"
import { GameMessage } from "../app/state/game/game"

type FakePlayer = {
    id: string
    name: string
    events: Array<{ event: string, args: unknown[] }>
    sendEvent: (event: string, ...args: unknown[]) => void
}

function player(id: string): FakePlayer {
    const result = {
        id,
        name: `Player ${id}`,
        events: [] as Array<{ event: string, args: unknown[] }>,
        sendEvent(event: string, ...args: unknown[]) {
            result.events.push({ event, args })
        }
    }

    return result
}

function room(host: FakePlayer) {
    return {
        host,
        sent: [] as Array<{ event: string, data: unknown }>,
        send(event: string, data: unknown) {
            this.sent.push({ event, data })
        }
    }
}

describe("CAFHGame", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    it("deals each joined player a hand and publishes state", () => {
        const host = player("HOST")
        const gameRoom = room(host)
        const game = new CAFHGame(gameRoom as never)

        game.playerJoined(host as never)

        expect(game.playerStates[host.id].hand).toHaveLength(9)
        expect(host.events).toHaveLength(1)
        expect(gameRoom.sent.at(-1)?.event).toBe(GameEvents.stateChanged)
    })

    it("starts a round only when host sends start command", () => {
        const host = player("HOST")
        const guest = player("GUEST")
        const third = player("THIRD")
        const gameRoom = room(host)
        const game = new CAFHGame(gameRoom as never)

        game.playerJoined(host as never)
        game.playerJoined(guest as never)
        game.playerJoined(third as never)
        game.onMessage(new GameMessage(guest.id, GameCommand.startGame, []))

        expect(game.stage).toBe(GameStage.waitingToStart)

        game.onMessage(new GameMessage(host.id, GameCommand.startGame, []))

        expect(game.stage).toBe(GameStage.startingRound)
        expect(gameRoom.sent.at(-1)?.event).toBe(GameEvents.stateChanged)
        expect(host.events.some(event => event.event === GameEvents.becomeCzar)).toBe(true)
        expect(guest.events.some(event => event.event === GameEvents.updateHand)).toBe(true)
    })

    it("ignores card commands for cards not in player hand", () => {
        const host = player("HOST")
        const guest = player("GUEST")
        const third = player("THIRD")
        const gameRoom = room(host)
        const game = new CAFHGame(gameRoom as never)

        game.playerJoined(host as never)
        game.playerJoined(guest as never)
        game.playerJoined(third as never)
        game.onMessage(new GameMessage(host.id, GameCommand.startGame, []))
        game.next()

        const before = game.playerStates[guest.id].pickedcard
        game.onMessage(new GameMessage(guest.id, GameCommand.pickCard, [9999]))

        expect(game.stage).toBe(GameStage.pickingCards)
        expect(game.playerStates[guest.id].pickedcard).toBe(before)
    })

    it("exports active game state as JSON", () => {
        const host = player("HOST")
        const gameRoom = room(host)
        const game = new CAFHGame(gameRoom as never)

        game.playerJoined(host as never)

        const exported = JSON.parse(game.exportState())

        expect(exported.stage).toBe(GameStage.waitingToStart)
        expect(exported.host).toBe(host.id)
        expect(exported.playerStates).toHaveLength(1)
    })
})
