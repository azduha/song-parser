import { AbstractParser } from './parsers/_AbstractParser';
import { Song } from './types/song';

export class ParserManager {
    private parsers: AbstractParser[] = [];

    public registerParser(parser: AbstractParser): void {
        this.parsers.push(parser);
    }

    public async parse(url: URL, options: Record<string, never> = {}): Promise<Song | null> {
        for (const parser of this.parsers) {
            const result = await parser.parse(url, options);
            if (result) {
                return result;
            }
        }

        return null;
    }
}
