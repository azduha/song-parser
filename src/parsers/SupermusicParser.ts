import axios from 'axios';
import { parse } from 'node-html-parser';
import { Song } from '../types/song';
import { AbstractParser, ParserOptions } from './_AbstractParser';
import { parseTxt } from './utils/parseTxt';

export class SupermusicParser extends AbstractParser {
    public async parse(url: URL, options: ParserOptions): Promise<Song | null> {
        const hostname = url.hostname;
        if (!hostname.startsWith('supermusic')) {
            return null;
        }

        const infoBody = await axios.get(url.toString());
        const interpret = parse(infoBody.data).querySelector('.interpret');
        const header = parse(infoBody.data).querySelector('.test3');

        if (!interpret || !header) {
            console.error('No songinfo found');
            return null;
        }

        const id = url.searchParams.get('idpiesne');

        const txtBody = await axios.get(`https://supermusic.cz/export.php?idpiesne=${id}&stiahni=1&typ=TXT`);
        const rows = txtBody.data.replaceAll('\r', '').split('\n').slice(3);

        const sections = parseTxt(rows);

        return {
            title: interpret.textContent || 'Unknown',
            artist: header.textContent.replace(`${interpret.textContent} - `, '') || 'Unknown',
            url: url.toString(),
            sections,
        };
    }
}
