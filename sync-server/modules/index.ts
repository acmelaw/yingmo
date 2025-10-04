/**
 * Module initialization - register all note type modules
 */

import { moduleRegistry } from "../services/ModuleRegistry.js";
import { textNoteModule } from "./text.js";
import { richTextNoteModule } from "./rich-text.js";
import { markdownNoteModule } from "./markdown.js";
import { codeNoteModule } from "./code.js";
import { imageNoteModule } from "./image.js";
import { smartLayerNoteModule } from "./smart-layer.js";

export async function initializeModules() {
  console.log("Initializing note modules...");

  // Register all core modules
  await moduleRegistry.register(textNoteModule);
  await moduleRegistry.register(richTextNoteModule);
  await moduleRegistry.register(markdownNoteModule);
  await moduleRegistry.register(codeNoteModule);
  await moduleRegistry.register(imageNoteModule);
  await moduleRegistry.register(smartLayerNoteModule);

  console.log(`All modules initialized. Registered types: ${moduleRegistry.getRegisteredNoteTypes().join(", ")}`);
}
