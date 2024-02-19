import axios from 'axios';
import { parse } from 'node-html-parser';
import { Song } from '../types/song';
import { AbstractParser, ParserOptions } from './_AbstractParser';
import { parseAgama } from './utils/parseAgama';

export class VelkyZpevnikParser extends AbstractParser {
    public async parse(url: URL, options: ParserOptions): Promise<Song | null> {
        const hostname = url.hostname;

        if (!hostname.includes('velkyzpevnik.cz')) {
            return null;
        }

        const body = await axios.get(url.toString());
        const song = parse(body.data).querySelector('.song');
        const content = song?.querySelector('.chordsAndLyrics');

        if (!song || !content) {
            console.error('No content found');
            return null;
        }

        const rows = parse(content.textContent).textContent.replaceAll('\r\n', '\n').split('\n');

        const sections = parseAgama(rows);

        return {
            title: song.querySelector('h1')?.textContent || 'Unknown',
            artist: song.querySelector('h3 a')?.textContent || 'Unknown',
            url: url.toString(),
            sections,
        };
    }
}
