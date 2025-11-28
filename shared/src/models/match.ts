interface MatchedUserInfo {
    userId: string;
    displayName: string;
    email?: string;
    picture?: string;
    difficulty: string;
    topic: string;
    language: string;
    questionSeed?: string;
}

export { MatchedUserInfo };