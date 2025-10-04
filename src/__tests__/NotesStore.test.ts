import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotesStore } from '@/stores/notesModular';
import { moduleRegistry } from '@/core/ModuleRegistry';
import { textNoteModule } from '@/modules/text';
import { isTextNote } from '@/types/note';

describe('NotesStore (Modular)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    moduleRegistry.clear();
  });

  it('should create a text note', async () => {
    await moduleRegistry.register(textNoteModule);
    const store = useNotesStore();
    
    const id = await store.create('text', { text: 'Test note' });
    
    expect(id).toBeDefined();
    expect(store.notes).toHaveLength(1);
    expect(store.notes[0].type).toBe('text');
    if (isTextNote(store.notes[0])) {
      expect(store.notes[0].text).toBe('Test note');
    }
  });

  it('should add a text note (legacy method)', () => {
    const store = useNotesStore();
    
    const id = store.add('Test note');
    
    expect(id).toBeDefined();
    expect(store.notes).toHaveLength(1);
    expect(store.notes[0].type).toBe('text');
  });

  it('should update a note', async () => {
    await moduleRegistry.register(textNoteModule);
    const store = useNotesStore();
    
    const id = await store.create('text', { text: 'Original' });
    await store.update(id, { text: 'Updated' });
    
    const note = store.notes.find(n => n.id === id);
    if (note && isTextNote(note)) {
      expect(note.text).toBe('Updated');
    }
  });

  it('should remove a note', async () => {
    await moduleRegistry.register(textNoteModule);
    const store = useNotesStore();
    
    const id = await store.create('text', { text: 'To delete' });
    await store.remove(id);
    
    expect(store.notes).toHaveLength(0);
  });

  it('should archive and unarchive notes', async () => {
    await moduleRegistry.register(textNoteModule);
    const store = useNotesStore();
    
    const id = await store.create('text', { text: 'To archive' });
    await store.archive(id);
    
    expect(store.filteredNotes).toHaveLength(0);
    expect(store.archivedNotes).toHaveLength(1);
    
    await store.unarchive(id);
    
    expect(store.filteredNotes).toHaveLength(1);
    expect(store.archivedNotes).toHaveLength(0);
  });

  it('should filter notes by search query', async () => {
    await moduleRegistry.register(textNoteModule);
    const store = useNotesStore();
    
    await store.create('text', { text: 'First note' });
    await store.create('text', { text: 'Second note' });
    await store.create('text', { text: 'Different content' });
    
    store.searchQuery = 'note';
    
    expect(store.filteredNotes).toHaveLength(2);
  });

  it('should filter notes by category', async () => {
    await moduleRegistry.register(textNoteModule);
    const store = useNotesStore();
    
    await store.create('text', { text: 'Work note', category: 'work' });
    await store.create('text', { text: 'Personal note', category: 'personal' });
    
    store.selectedCategory = 'work';
    
    expect(store.filteredNotes).toHaveLength(1);
    expect(store.filteredNotes[0].category).toBe('work');
  });

  it('should export and import data', async () => {
    await moduleRegistry.register(textNoteModule);
    const store = useNotesStore();
    
    await store.create('text', { text: 'Note 1' });
    await store.create('text', { text: 'Note 2' });
    
    const exported = store.exportData();
    
    expect(exported.version).toBe('2.0.0');
    expect(exported.data.notes).toHaveLength(2);
    
    store.clearAll();
    expect(store.notes).toHaveLength(0);
    
    const success = store.importData(exported);
    
    expect(success).toBe(true);
    expect(store.notes).toHaveLength(2);
  });

  it('should migrate old notes to new format', () => {
    const store = useNotesStore();
    
    const oldData = {
      version: '1.0.0',
      data: {
        notes: [
          { id: '1', text: 'Old note', created: Date.now(), updated: Date.now() },
        ],
        categories: [],
        searchQuery: '',
        selectedCategory: null,
        sortBy: 'created',
        sortOrder: 'desc',
      },
    };
    
    const success = store.importData(oldData);
    
    expect(success).toBe(true);
    expect(store.notes).toHaveLength(1);
    expect(store.notes[0].type).toBe('text');
  });

  it('should get notes by type', async () => {
    await moduleRegistry.register(textNoteModule);
    const store = useNotesStore();
    
    await store.create('text', { text: 'Text note 1' });
    await store.create('text', { text: 'Text note 2' });
    
    const textNotes = store.getNotesByType('text');
    
    expect(textNotes).toHaveLength(2);
  });

  it('should track categories automatically', async () => {
    await moduleRegistry.register(textNoteModule);
    const store = useNotesStore();
    
    await store.create('text', { text: 'Note', category: 'work' });
    await store.create('text', { text: 'Note', category: 'personal' });
    await store.create('text', { text: 'Note', category: 'work' });
    
    expect(store.categories).toHaveLength(2);
    expect(store.categories).toContain('work');
    expect(store.categories).toContain('personal');
  });
});
