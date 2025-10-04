/**
 * Text Note Module - handles basic text notes
 */

import type { NoteModule, NoteTypeHandler } from '@/types/module';
import type { TextNote } from '@/types/note';
import TextNoteEditor from './components/TextNoteEditor.vue';
import TextNoteViewer from './components/TextNoteViewer.vue';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const textNoteHandler: NoteTypeHandler = {
  async create(data: any): Promise<TextNote> {
    return {
      id: createId(),
      type: 'text',
      text: data.text || '',
      created: Date.now(),
      updated: Date.now(),
      category: data.category,
      tags: data.tags,
      archived: data.archived || false,
      metadata: data.metadata,
    };
  },

  async update(note, updates) {
    const textNote = note as TextNote;
    return {
      ...textNote,
      ...updates,
      type: 'text', // Ensure type doesn't change
      updated: Date.now(),
    } as TextNote;
  },

  async delete(note) {
    // Cleanup if needed
    console.log(`Deleting text note ${note.id}`);
  },

  validate(note) {
    const textNote = note as TextNote;
    return (
      !!textNote.id &&
      textNote.type === 'text' &&
      typeof textNote.text === 'string' &&
      !!textNote.created
    );
  },

  serialize(note) {
    return JSON.stringify(note);
  },

  deserialize(data: string) {
    return JSON.parse(data) as TextNote;
  },
};

export const textNoteModule: NoteModule = {
  id: 'text-note',
  name: 'Text Notes',
  version: '1.0.0',
  description: 'Basic text note support',
  supportedTypes: ['text'],

  async install(context) {
    context.registerNoteType('text', textNoteHandler);
    console.log('Text note module installed');
  },

  components: {
    editor: TextNoteEditor,
    viewer: TextNoteViewer,
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
