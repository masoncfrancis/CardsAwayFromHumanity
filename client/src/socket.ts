import { io } from "socket.io-client"

export const socket = io(
  import.meta.env.DEV ? `ws://${window.location.hostname}:3000` : undefined
)
