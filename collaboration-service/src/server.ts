import express from "express";
import cors from "cors";
import http from "http";
import { attachWebsocketServer } from "./config/websocket";

const app = express();
app.use(express.json());
app.use(cors({
    origin: process.env.UI_BASE_URL,
    credentials: true,
}))

app.get("/", (req, res) => res.send("Collaboration Service is running!"));

const server = http.createServer(app);
attachWebsocketServer(server);

export default server;
