import express from "express";
import { enqueueUser, dequeueUsers } from "../db/redis";
import { MatchedUserInfo } from "shared";
import { notifyMatch } from "../config/websocket";
import { Difficulty, Topic, Language } from "shared";
import { resolveMatchedValue } from "../utils/match";

const router = express.Router();

router.post("/start", async (req, res) => {
    const userInfo = req.body as MatchedUserInfo;
    try {
        (async () => {
            await enqueueUser(userInfo);
            const pairs = await dequeueUsers(userInfo.difficulty, userInfo.topic, userInfo.language);
            for (const [user1Info, user2Info] of pairs) {
                const matchedDifficulty = resolveMatchedValue(user1Info.difficulty, user2Info.difficulty, Difficulty);
                const matchedTopic = resolveMatchedValue(user1Info.topic, user2Info.topic, Topic);
                const matchedLanguage = resolveMatchedValue(user1Info.language, user2Info.language, Language);
                notifyMatch(user1Info, user2Info, matchedDifficulty, matchedTopic, matchedLanguage);
            }
        })();
        return res.status(200).send({ message: "Matching started" });
    } catch (err) {
        console.error("Error starting matching:", err);
        return res.status(500).send({ error: "Failed to start matching" });
    }
});

export default router;
