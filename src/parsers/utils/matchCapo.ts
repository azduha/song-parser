const capoRegex = /([KkCc][Aa][Pp]|[Tt][Rr][Aa][Nn][Ss])\S*/;

export function matchCapo(content: string): RegExpMatchArray | null {
    return content.match(capoRegex);
}
