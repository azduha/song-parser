const capoRegex = /[KkCc]ap\S*/;

export function matchCapo(content: string): RegExpMatchArray | null {
    return content.match(capoRegex);
}
