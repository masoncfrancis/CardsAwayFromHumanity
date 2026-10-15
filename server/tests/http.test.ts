import request from "supertest"
import { describe, expect, it } from "vitest"
import { app } from "../app/lib/io"

describe("HTTP app", () => {
    it("serves the client for valid room routes", async () => {
        const response = await request(app).get("/ABCD")

        expect(response.status).toBe(200)
        expect(response.text).toContain("Cards Away From Humanity")
    })

    it("does not treat invalid room codes as client routes", async () => {
        const response = await request(app).get("/abc")

        expect(response.status).toBe(404)
    })
})
