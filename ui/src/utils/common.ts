export const getEnumDisplayName = (value: string): string => {
    value = value.replace(/_/g, " ").toLowerCase();
    return value.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

export const getLanguageDisplayName = (language: string): string => {
    switch (language) {
        case 'PYTHON':
            return 'Python';
        case 'JAVASCRIPT':
            return 'JavaScript';
        case 'JAVA':
            return 'Java';
        case 'CPP':
            return 'C++';
        case 'CSHARP':
            return 'C#';
        case 'GO':
            return 'Go';
        case 'RUBY':
            return 'Ruby';
        case 'ANY':
            return 'Any';
        default:
            return "Unknown";
    }
};