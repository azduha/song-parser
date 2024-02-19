import { Song } from './types/song';

export function xmlSerialize(content: Song): string {
    let string = '';

    // XML header
    string += '<?xml version="1.0" encoding="UTF-8"?>\n';

    // Song metadata
    string += '<song>\n';
    string += `    <title>${content.title}</title>\n`;
    string += `    <artist>${content.artist}</artist>\n`;
    string += `    <url>${content.url}</url>\n`;
    string += '    \n';

    // Song sections
    string += '    <sections>\n';
    for (const section of content.sections) {
        string += `        <section${section.name && ` name="${section.name}"`}>\n`;
        for (const row of section.content) {
            string += `            ${row
                .map((token) => (token.type === 'text' ? token.value : `<chord value="${token.value}"/>`))
                .join('')}\n`;
        }
        string += '        </section>\n';
    }
    string += '    </sections>\n';

    string += '</song>';

    return string;
}
