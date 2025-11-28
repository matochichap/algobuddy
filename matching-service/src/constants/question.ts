import { normalise } from "../utils/match";
import { Difficulty, Topic, Language } from "shared";

const allDifficulties = Object.values(Difficulty).map(d => normalise(d));
const allTopics = Object.values(Topic).map(t => normalise(t));
const allLanguages = Object.values(Language).map(l => normalise(l));

export { allDifficulties, allTopics, allLanguages };