function normalise(str: string): string {
    return str.trim().toLowerCase().replace(/ /g, '_');
}

export { normalise };