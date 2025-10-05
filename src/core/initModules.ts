/**
 * Module initialization and registration
 * Import and register all note modules here
 */

import { moduleRegistry } from "@/core/ModuleRegistry";
import { textNoteModule } from "@/modules/text";
import { markdownNoteModule } from "@/modules/markdown";
import { codeNoteModule } from "@/modules/code";
import { richTextNoteModule } from "@/modules/rich-text";
import { imageNoteModule } from "@/modules/image";
import { smartLayerNoteModule } from "@/modules/smart-layer";
import { todoModule } from "@/modules/todo";
import caesarCipherModule from "@/modules/caesar-cipher";

export async function initializeModules() {
  console.log("Initializing note modules...");

  // Register all core modules
  await moduleRegistry.register(textNoteModule);
  await moduleRegistry.register(markdownNoteModule);
  await moduleRegistry.register(codeNoteModule);
  await moduleRegistry.register(richTextNoteModule);
  await moduleRegistry.register(imageNoteModule);
  await moduleRegistry.register(smartLayerNoteModule);
  await moduleRegistry.register(todoModule);

  // Register view-only modules
  await moduleRegistry.register(caesarCipherModule);

  console.log("All modules initialized");
}
