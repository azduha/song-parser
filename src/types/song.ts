export type Song = {
    title: string;
    artist: string;
    url: string;
    capo?: number;
    sections: Section[];
};

export type Section = {
    name: string | null;
    content: Paragraph[];
};

export type Paragraph = Token[];

export type Token =
    | {
          type: 'text';
          value: Text;
      }
    | {
          type: 'chord';
          value: Chord;
      };

export type Text = string;
export type Chord = string;
