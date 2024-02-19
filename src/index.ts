import dotenv from 'dotenv';
import fs from 'fs';
import { ParserManager } from './ParserManager';
import { PisnickyAkordyParser } from './parsers/PisnickyAkordyParser';
import { SupermusicParser } from './parsers/SupermusicParser';
import { VelkyZpevnikParser } from './parsers/VelkyZpevnikParser';
import { ZpevnikWzParser } from './parsers/ZpevnikWzParser';
import { songs } from './songs';
import { xmlSerialize } from './xmlSerializer';

dotenv.config();

const parserManager = new ParserManager();
parserManager.registerParser(new PisnickyAkordyParser());
parserManager.registerParser(new SupermusicParser());
parserManager.registerParser(new VelkyZpevnikParser());
parserManager.registerParser(new ZpevnikWzParser());

(async () => {
    for (const url of songs) {
        const result = await parserManager.parse(new URL(url));

        if (!result) {
            console.error('No result for ' + url);
        } else {
            const string = xmlSerialize(result);

            const filename = result.title
                .normalize('NFKD')
                .replace(/[^\w\s.-_\/]/g, '')
                .replace(/[^a-z0-9]/gi, '_')
                .toLowerCase();
            fs.writeFileSync(`out/${filename}.xml`, string);
        }
    }

    console.log('Done!');
})();
