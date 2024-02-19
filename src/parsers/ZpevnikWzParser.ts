import axios from 'axios';
import { parse } from 'node-html-parser';
import { Song } from '../types/song';
import { AbstractParser, ParserOptions } from './_AbstractParser';
import { parseAgama } from './utils/parseAgama';

export class ZpevnikWzParser extends AbstractParser {
    public async parse(url: URL, options: ParserOptions): Promise<Song | null> {
        const hostname = url.hostname;

        if (!hostname.includes('zpevnik.wz.cz')) {
            return null;
        }

        const body = await axios.get(url.toString());
        const song = parse(body.data).querySelector('#middle .content');
        const content = song?.querySelector('.song');

        if (!song || !content) {
            7;
            console.error('No content found');
            return null;
        }

        const rows = parse(content.textContent).textContent.replaceAll('\r\n', '\n').split('\n');

        const sections = parseAgama(rows);

        const title = song.querySelector('h1')?.textContent || 'Unknown (Unknown)';
        const artist = song.querySelector('h1 a')?.textContent || 'Unknown';

        return {
            title: title.replace(` (${artist})`, ''),
            artist,
            url: url.toString(),
            sections,
        };
    }
}
