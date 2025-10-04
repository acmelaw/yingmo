/**
 * Module initialization and registration
 * Import and register all note modules here
 */

import { moduleRegistry } from '@/core/ModuleRegistry';
import { textNoteModule } from '@/modules/text';

export async function initializeModules() {
  console.log('Initializing note modules...');
  
  // Register core modules
  await moduleRegistry.register(textNoteModule);
  
  // Future modules can be registered here:
  // await moduleRegistry.register(imageNoteModule);
  // await moduleRegistry.register(smartLayerNoteModule);
  // await moduleRegistry.register(markdownNoteModule);
  // await moduleRegistry.register(codeNoteModule);
  
  console.log('All modules initialized');
}
