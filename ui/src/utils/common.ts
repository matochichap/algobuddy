export const getEnumDisplayName = (value: string): string => {
    value = value.replace(/_/g, " ").toLowerCase();
    return value.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};