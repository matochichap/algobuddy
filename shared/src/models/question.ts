interface Question {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    topics: Topic[];
}

enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD'
}

enum Topic {
    ARRAY = 'ARRAY',
    STRING = 'STRING',
    HASH_TABLE = 'HASH_TABLE',
    MATH = 'MATH',
    GREEDY = 'GREEDY',
    GRAPH = 'GRAPH',
    TREE = 'TREE',
    DYNAMIC_PROGRAMMING = 'DYNAMIC_PROGRAMMING',
    RECURSION = 'RECURSION',
    BACKTRACKING = 'BACKTRACKING'
}

enum Language {
    PYTHON = 'PYTHON',
    JAVASCRIPT = 'JAVASCRIPT',
    JAVA = 'JAVA',
    CPP = 'CPP',
    CSHARP = 'CSHARP',
    GO = 'GO',
    RUBY = 'RUBY'
}

export { Question, Difficulty, Topic, Language };