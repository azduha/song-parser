import { Section, Token } from '../../types/song';
import { matchCapo } from './matchCapo';
import { matchSectionName } from './matchSectionName';

export function parseTxt(content: string[]): Section[] {
    // Remove rows with metadata (capo)
    content = content.filter((row) => !matchCapo(row));

    // Move section titles to the same row as the first row of the section
    content = content
        .map((row, i) => {
            const match = matchSectionName(row);
            if (match && match.index === 0 && match[0].length === row.length) {
                if (content[i + 1]) {
                    content[i + 1] = match[0] + content[i + 1];
                }
                return null as any;
            }
            return row;
        })
        .filter((row) => row !== null) as string[];

    // Split the content into sections
    const sections: string[][] = [[]];
    for (let i = 0; i < content.length; i++) {
        if (content[i].trim().length === 0) {
            sections.push([]);
        } else {
            sections[sections.length - 1].push(content[i]);
        }
    }

    // Additionally split sections if the text matches a section name
    const splitSections = sections
        .map((section) => {
            const split: string[][] = [[]];
            for (const row of section) {
                const match = matchSectionName(row || '');
                if (match) {
                    split.push([]);
                }
                split[split.length - 1].push(row);
            }
            return split;
        })
        .flat(1);

    // Match chords (in square brackets) and create tokens
    const tokenized = splitSections.map((section) =>
        section.map((row) => {
            const tokens = [] as Token[];

            const chords = row.matchAll(/\[([^\n+]+?)\]/g);

            let lastIndex = 0;
            for (const chord of chords) {
                if (chord.index !== undefined) {
                    tokens.push({ type: 'text', value: row.slice(lastIndex, chord.index) });
                    tokens.push({ type: 'chord', value: chord[1] });
                    lastIndex = chord.index + chord[0].length;
                }
            }

            tokens.push({ type: 'text', value: row.slice(lastIndex) });

            return tokens;
        }),
    );

    // Remove replace multiple spaces with a single space
    for (const section of tokenized) {
        for (const row of section) {
            for (const token of row) {
                if (token.type === 'text') {
                    token.value = token.value.replace(/\s+/g, ' ');
                }
            }
        }
    }

    // Create sections
    const finalSections = tokenized.map((section) => {
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
