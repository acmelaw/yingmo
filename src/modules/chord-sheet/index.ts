/**
 * Chord Sheet Module - Guitar/Music chord sheets with transposition
 */

import type { NoteModule, NoteTypeHandler } from "@/types/module";
import type { ChordSheetNote } from "@/types/note";
import ChordSheetNoteEditor from "./components/ChordSheetNoteEditor.vue";
import ChordSheetNoteViewer2 from "./components/ChordSheetNoteViewer2.vue";
import { detectFormat, extractMetadata } from "./formats";

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextTimestamp(previous: number): number {
  const now = Date.now();
  return now > previous ? now : previous + 1;
}

const chordSheetHandler: NoteTypeHandler = {
  async create(data: any): Promise<ChordSheetNote> {
    const content = (data?.content ?? data?.text ?? "") as string;

    // Extract metadata from ChordPro format if present
    const extractedMeta = extractMetadata(content);

    // Merge parameters from slash command, ChordPro directives, and explicit metadata
    const metadata = {
      transpose: data?.transpose ?? data.metadata?.transpose ?? 0,
      originalKey: data?.key ?? data.metadata?.originalKey ?? extractedMeta.key,
      capo: data?.capo ?? data.metadata?.capo ?? extractedMeta.capo,
      artist: data?.artist ?? data.metadata?.artist ?? extractedMeta.artist,
      title: data?.title ?? data.metadata?.title ?? extractedMeta.title,
      format: data?.format ?? data.metadata?.format,
      ...data.metadata,
    };

    return {
      id: createId(),
      type: "chord-sheet",
      content,
      created: Date.now(),
      updated: Date.now(),
      category: data.category,
      tags: data.tags,
      archived: data.archived || false,
      metadata,
    };
  },

  async update(note, updates) {
    const chordNote = note as ChordSheetNote;
    const nextContent =
      (updates.content as string | undefined) ?? chordNote.content;

    return {
      ...chordNote,
      ...updates,
      type: "chord-sheet",
      content: nextContent,
      metadata: {
        ...chordNote.metadata,
        ...updates.metadata,
      },
      updated: nextTimestamp(chordNote.updated),
    } as ChordSheetNote;
  },

  async delete(note) {
    console.log(`Deleting chord sheet ${note.id}`);
  },

  validate(note) {
    const chordNote = note as ChordSheetNote;
    return (
      !!chordNote.id &&
      chordNote.type === "chord-sheet" &&
      typeof chordNote.content === "string" &&
      !!chordNote.created &&
      !!chordNote.metadata
    );
  },

  serialize(note) {
    return JSON.stringify(note);
  },

  deserialize(data: string) {
    return JSON.parse(data) as ChordSheetNote;
  },
};

export const chordSheetModule: NoteModule = {
  id: "chord-sheet",
  name: "Chord Sheets",
  version: "1.0.0",
  description: "Guitar and music chord sheets with transposition",
  supportedTypes: ["chord-sheet"],

  // Slash commands for this module
  slashCommands: [
    {
      command: "/chords",
      aliases: ["/chord", "/guitar", "/music", "/chord-sheet"],
      description:
        "Create a chord sheet with parameters like /chords/transpose=2/key=G",
      icon: "🎸",
      defaultParameters: {
        transpose: 0,
        format: "chordpro",
      },
      examples: [
        "/chords {title:Amazing Grace} {artist:John Newton} [G]Amazing [C]grace",
        "/chords/transpose=2/key=G [G]Amazing [C]grace",
        "/chords/format=tab | G C | D Em |",
      ],
    },
  ],

  // Configurable parameters for chord sheets
  parameters: [
    {
      id: "transpose",
      label: "Transpose",
      type: "number",
      defaultValue: 0,
      min: -12,
      max: 12,
      step: 1,
      description: "Transpose chords by semitones",
    },
    {
      id: "capo",
      label: "Capo",
      type: "number",
      defaultValue: 0,
      min: 0,
      max: 12,
      step: 1,
      description: "Capo position",
    },
    {
      id: "title",
      label: "Song Title",
      type: "string",
      description: "Title of the song",
    },
    {
      id: "artist",
      label: "Artist",
      type: "string",
      description: "Artist or band name",
    },
  ],

  async install(context) {
    context.registerNoteType("chord-sheet", chordSheetHandler);
    console.log("Chord sheet module installed");
  },

  components: {
    editor: ChordSheetNoteEditor,
    viewer: ChordSheetNoteViewer2,
  },

  capabilities: {
    canCreate: true,
    canEdit: true,
    canTransform: true,
    canExport: true,
    canImport: true,
    supportsSearch: true,
  },
};
