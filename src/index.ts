import dotenv from 'dotenv';
import fs from 'fs';
import { forEver } from 'waitasecond';
import { ParserManager } from './ParserManager';
import { PisnickyAkordyParser } from './parsers/PisnickyAkordyParser';

dotenv.config();

const parserManager = new ParserManager();
parserManager.registerParser(new PisnickyAkordyParser());

const songs = ['https://pisnicky-akordy.cz/druha-trava/letni-romance'];

(async () => {
    for (const url of songs) {
        const result = await parserManager.parse(new URL(url));
        let string = '';
        if (!result) {
            console.error('No result for ' + url);
        } else {
            string += `Name: ${result.title}\n`;
            string += `Artist: ${result.artist}\n`;
            string += `URL: ${result.url}\n`;
            string += '\n';
            for (const section of result.sections) {
                string += `> ${section.name}\n`;
                for (const paragraph of section.content) {
                    for (const token of paragraph) {
                        if (token.type === 'text') {
                            string += token.value;
                        } else {
                            string += `[${token.value}]`;
                        }
                    }
                    string += '\n';
                }
                string += '\n';
            }

            fs.writeFileSync(`out/${result.title} (${result.artist}).txt`, string);
        }
    }

    console.log('Done!');
    await forEver();
})();
