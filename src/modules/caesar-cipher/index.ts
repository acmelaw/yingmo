import type { NoteModule } from '@/types/module';
import CaesarCipherNoteViewer from './components/CaesarCipherNoteViewer.vue';

const caesarCipherModule: NoteModule = {
  id: 'caesar-cipher',
  name: 'Caesar Cipher',
  version: '1.0.0',
  description: 'View notes encrypted with ROT13 cipher',
  supportedTypes: [], // View-only module, doesn't create notes
  
  components: {
    viewer: CaesarCipherNoteViewer,
    // No editor - this is view-only
  },
  
  capabilities: {
    canCreate: false,   // Can't create new cipher notes directly
    canEdit: false,      // Can't edit in cipher mode
    canTransform: true,  // Can transform other notes to view as cipher
  },
};

export default caesarCipherModule;

