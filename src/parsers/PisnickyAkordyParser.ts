import axios from 'axios';
import { parse } from 'node-html-parser';
import { Song } from '../types/song';
import { AbstractParser, ParserOptions } from './_AbstractParser';
import { parseAgama } from './utils/parseAgama';

export class PisnickyAkordyParser extends AbstractParser {
    public async parse(url: URL, options: ParserOptions): Promise<Song | null> {
        const hostname = url.hostname;
        if (!hostname.includes('pisnicky-akordy.cz')) {
            return null;
        }

        const body = await axios.get(url.toString());
        const songheader = parse(body.data).querySelector('#songheader');
        const content = parse(body.data).querySelector('#songtext pre');

        if (!content || !songheader) {
            console.error('No content found');
            return null;
        }

        const rawRows = parse(content.text).childNodes;
        if (rawRows.length === 0) {
            console.error('Content is empty');
            return null;
        }

        const rows = rawRows
            .map((row) => row.text)
            .join('')
            .replaceAll('\r\n', '\n')
            .split('\n');

        const sections = parseAgama(rows);

        return {
            title: songheader.querySelector('h1 a')?.textContent || 'Unknown',
            artist: songheader.querySelector('h2 a')?.textContent || 'Unknown',
            url: url.toString(),
            sections,
        };
    }
}
