function normalise(str: string): string {
    return str.trim().toUpperCase().replace(/ /g, "_");
}

export { normalise };