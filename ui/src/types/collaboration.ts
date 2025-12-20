interface ChatMessage {
    sender: string;
    content: string;
}

interface PistonResponse {
    run: {
        stdout: string;
        stderr: string;
        code: number;
        output: string;
    };
    compile?: {
        stdout: string;
        stderr: string;
        code: number;
    };
}

interface AvatarInfo {
    userId: string;
    displayName: string;
    picture?: string;
}

export type { ChatMessage, PistonResponse, AvatarInfo };