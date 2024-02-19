const notes = '[ABCDEFGH]',
    accidentals = '(b|bb)?',
    chords = '(m|mi|mol|maj7|maj|min7|min|sus)?',
    suspends = '(1|2|3|4|5|6|7|8|9)?',
    sharp = '(#)?';

const chordsRegex = new RegExp('\\b' + notes + accidentals + chords + suspends + '\\b' + sharp, 'g');

export function matchChords(content: string): RegExpMatchArray[] {
    return [...content.matchAll(chordsRegex)];
}
