import dotenv from 'dotenv';
import { forEver } from 'waitasecond';
import { ParserManager } from './ParserManager';
import { PisnickyAkordyParser } from './parsers/PisnickyAkordyParser';

dotenv.config();

const parserManager = new ParserManager();
parserManager.registerParser(new PisnickyAkordyParser());

(async () => {
    const url = 'https://pisnicky-akordy.cz/tomas-klus/az';

    const result = await parserManager.parse(new URL(url));
    if (!result) {
        console.error('No result');
    } else {
        console.log(`Name: ${result.title}`);
        console.log(`Artist: ${result.artist}`);
        console.log(`URL: ${result.url}`);
        console.log('');
        for (const section of result.sections) {
            console.log(`> ${section.name}`);
            for (const paragraph of section.content) {
                for (const token of paragraph) {
                    if (token.type === 'text') {
                        process.stdout.write(token.value);
                    } else {
                        process.stdout.write(`[${token.value}]`);
                    }
                }
                console.log('');
            }
            console.log('');
        }
    }

    await forEver();
})();
