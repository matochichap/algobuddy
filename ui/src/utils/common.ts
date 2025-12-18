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

/**
 * Get relative time string
 * @param date 
 * @returns string
 */
export function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Get member since string
 * @param date 
 * @returns string
 */
export function getMemberSince(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}