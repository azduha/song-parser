export const sectionNameRegex = /^#?[a-zA-Z0-9À-ž]+[:\.\)]\s*/;

export function matchSectionName(content: string): RegExpMatchArray | null {
    return content.match(sectionNameRegex);
}
