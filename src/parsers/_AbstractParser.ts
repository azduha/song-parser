import { Song } from '../types/song';

export interface ParserOptions {}

export abstract class AbstractParser {
    public abstract parse(url: URL, options: ParserOptions): Promise<Song | null>;
}
