import express from "express";
import cors from "cors";
import questionRoutes from "./routes/question";

const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.UI_BASE_URL,
    credentials: true,
}));

app.use("/api/question", questionRoutes);

app.get("/", (req, res) => {
    res.send("Question Service is running!");
});

export default app;