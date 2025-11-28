interface Question {
    id: string;
    title: string;
    description: string;
    //image?: ;
    //testCases?: string[];
}

enum Difficulty {
    EASY = 'Easy',
    MEDIUM = 'Medium',
    HARD = 'Hard'
}

enum Topic {
    ARRAY = 'Array',
    STRING = 'String',
    HASH_TABLE = 'Hash Table',
    MATH = 'Math',
    GREEDY = 'Greedy',
    GRAPH = 'Graph',
    TREE = 'Tree',
    DYNAMIC_PROGRAMMING = 'Dynamic Programming',
    RECURSION = 'Recursion',
    BACKTRACKING = 'Backtracking'
}

enum Language {
    PYTHON = 'Python',
    JAVASCRIPT = 'JavaScript',
    JAVA = 'Java',
    CPP = 'C++',
    CSHARP = 'C#',
    GO = 'Go',
    RUBY = 'Ruby'
}

export { Question, Difficulty, Topic, Language };