import { Server } from "socket.io"
import express from "express"
import path from "path"
import * as http from "http"

export const app = express();
export const server = http.createServer(app)

const startPath = __dirname.includes(`${path.sep}build${path.sep}`)
    ? path.join(__dirname, '../../../../dist')
    : path.join(__dirname, '../../dist')

console.log(startPath)

app.use(express.static(startPath));

app.get('/:roomCode', function (req, res, next) {
    if (!/^[A-Z]{4}$/.test(req.params.roomCode)) {
        next()
        return
    }

    res.sendFile(path.join(startPath, "index.html"), { dotfiles: "allow" });
});

export const io = new Server(server)
