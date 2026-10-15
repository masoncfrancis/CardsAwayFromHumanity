import { describe, expect, it } from "vitest"
import { Deck } from "../app/state/game/CardDeck"

describe("Deck", () => {
    it("deals distinct white cards", () => {
        const deck = new Deck()

        const hand = deck.pickCards(10)

        expect(hand).toHaveLength(9)
        expect(new Set(hand).size).toBe(hand.length)
        expect(hand.every(card => card >= 0 && card < 459)).toBe(true)
    })

    it("moves played cards into discard when discarded", () => {
        const deck = new Deck()
        const card = deck.pickCard()

        deck.discard(card)

        expect(deck.cardsInPlay.has(card)).toBe(false)
        expect(deck.discardPile).toContain(card)
    })

    it("does not repeat black cards until deck is exhausted", () => {
        const deck = new Deck()
        const blackCards = Array.from({ length: 76 }, () => deck.getBlackCard())

        expect(new Set(blackCards).size).toBe(76)
        expect(blackCards.every(card => card >= 0 && card < 76)).toBe(true)
    })
})
