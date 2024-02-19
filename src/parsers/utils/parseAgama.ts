import { Section, Token } from '../../types/song';
import { matchCapo } from './matchCapo';
import { matchChords } from './matchChords';
import { matchSectionName } from './matchSectionName';

export function parseAgama(content: string[]): Section[] {
    // Remove rows with metadata (capo)
    content = content.filter((row) => !matchCapo(row));

    // Split the content into sections
    const sections: string[][] = [[]];
    for (let i = 0; i < content.length; i++) {
        if (content[i].trim().length === 0) {
            sections.push([]);
        } else {
            sections[sections.length - 1].push(content[i]);
        }
    }

    // Determine which rows are chords
    const parsed = sections.map((section) =>
        section.map((row, i) => {
            const chords = matchChords(row);
            const words = row.split(' ').filter((word) => word.trim().length > 0);

            if (chords.length > words.length / 2) {
                return {
                    type: 'chords',
                    value: row,
                };
            } else {
                return {
                    type: 'text',
                    value: row,
                };
            }
        }),
    );

    // Match chord rows to text rows
    const matched = parsed.map((section) =>
        section.reduce((acc, row, i) => {
            if (row.type === 'chords') {
                const nextRow = section[i + 1];
                if (nextRow && nextRow.type === 'text') {
                    acc.push({
                        lyrics: nextRow.value,
                        chords: row.value,
                    });
                }
                if (!nextRow || nextRow.type === 'chords') {
                    if (matchSectionName(row.value)) {
                        const matched = matchChords(row.value);
                        let lyrics = row.value;
                        let chords = ' '.repeat(row.value.length);
                        for (const match of matched) {
                            lyrics =
                                lyrics.slice(0, match.index) +
                                ' '.repeat(match[0].length) +
                                lyrics.slice(match.index! + match[0].length);
                            chords =
                                chords.slice(0, match.index) + match[0] + chords.slice(match.index! + match[0].length);
                        }
                        acc.push({
                            lyrics,
                            chords,
                        });
                    } else {
                        acc.push({
                            lyrics: null,
                            chords: row.value,
                        });
                    }
                }
            } else {
                const prevRow = section[i - 1];
                if (!prevRow || prevRow.type === 'text') {
                    acc.push({
                        lyrics: row.value,
                        chords: null,
                    });
                }
            }
            return acc;
        }, [] as { lyrics: string | null; chords: string | null }[]),
    );

    // Additionally split sections if the text matches a section name
    const splitSections = matched
        .map((section) => {
            const split: { lyrics: string | null; chords: string | null }[][] = [[]];
            for (const row of section) {
                const match = matchSectionName(row.lyrics || '');
                if (match) {
                    split.push([]);
                }
                split[split.length - 1].push(row);
            }
            return split;
        })
        .flat(1);

    // Merge the matched chords into tokens
    const merged = splitSections.map((section) =>
        section.reduce((acc, row) => {
            const rowAcc: Token[] = [];

            if (row.lyrics === null && row.chords === null) {
                acc.push(rowAcc);
                return acc;
            }
            if (row.lyrics === null) {
                row.chords!.split(' ')
                    .filter((chord) => chord.trim().length > 0)
                    .forEach((chord) => {
                        rowAcc.push({
                            type: 'chord',
                            value: chord,
                        });
                    });

                acc.push(rowAcc);
                return acc;
            }
            if (row.chords === null) {
                rowAcc.push({
                    type: 'text',
                    value: row.lyrics!,
                });

                acc.push(rowAcc);
                return acc;
            }

            // Find indices of all non-whitespace sequences in the chords
            const chordIndices: number[] = [];
            let match;
            const regex = /\S+/g;
            while ((match = regex.exec(row.chords)) !== null) {
                chordIndices.push(match.index);
            }

            // Split the lyrics at the indices and merge with the chords
            const tokens: Token[] = [];
            let lastIndex = 0;
            for (const index of chordIndices) {
                tokens.push({
                    type: 'text',
                    value: row.lyrics!.substring(lastIndex, index),
                });
                tokens.push({
                    type: 'chord',
                    value: row.chords!.substring(index).match(/\S+/)![0],
                });
                lastIndex = index;
            }
            tokens.push({
                type: 'text',
                value: row.lyrics!.substring(lastIndex),
            });
            rowAcc.push(...tokens);

            acc.push(rowAcc);
            return acc;
        }, [] as Token[][]),
    );

    // Remove replace multiple spaces with a single space
    for (const section of merged) {
        for (const row of section) {
            for (const token of row) {
                if (token.type === 'text') {
                    token.value = token.value.replace(/\s+/g, ' ');
                }
            }
        }
    }

    // Create sections
    const finalSections = merged.map((section) => {
        // Match the first row to a section name
        let name = null;
        if (section.length > 0) {
            const firstRow = section[0];
            if (firstRow.length > 0) {
                const firstToken = firstRow[0];
                if (firstToken.type === 'text') {
                    const match = matchSectionName(firstToken.value);
                    if (match) {
                        name = match[0].toString().trim().replace(':', '').replace(')', '').replace('.', '');

                        firstToken.value = firstToken.value.slice(match[0].length);
                    }
                }
            }
        }

        return {
            name,
            content: section,
        } as Section;
    });

    // Remove empty rows
    for (const section of finalSections) {
        section.content = section.content.filter(
            (row) => row.length > 0 && row.some((token) => token.value.trim().length > 0),
        );
    }

    // Remove empty sections
    const finalSectionsFiltered = finalSections.filter(
        (section) => section.content.length > 0 || section.name !== null,
    );

    // Add names to unnamed sections
    let unnamedSectionCounter = 1;
    for (let i = 0; i < finalSections.length; i++) {
        if (finalSections[i].name === null && finalSections[i].content.length >= 2) {
            finalSections[i].name = unnamedSectionCounter.toString();
            unnamedSectionCounter++;
        }
    }

    // Trim whitespace from the first and last token in each row
    for (const section of finalSectionsFiltered) {
        for (const row of section.content) {
            if (row.length > 0) {
                row[0].value = row[0].value.trimLeft();
                row[row.length - 1].value = row[row.length - 1].value.trimRight();
            }
        }
    }

    return finalSectionsFiltered;
}
