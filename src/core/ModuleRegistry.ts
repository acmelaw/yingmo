/**
 * Central registry for managing note modules
 */

import type { Component } from "vue";
import type {
  NoteModule,
  ModuleContext,
  NoteTypeHandler,
  NoteAction,
  TransformDefinition,
  SlashCommand,
} from "@/types/module";
import type { NoteType } from "@/types/note";

class ModuleRegistry {
  private modules = new Map<string, NoteModule>();
  private typeHandlers = new Map<NoteType, NoteTypeHandler>();
  private components = new Map<string, Component>();
  private actions = new Map<string, NoteAction>();
  private transforms = new Map<string, TransformDefinition>();
  private stores = new Map<string, any>();
  private services = new Map<string, any>();
  private slashCommands = new Map<string, { command: SlashCommand; module: NoteModule }>();

  /**
   * Register a new module
   */
  async register(module: NoteModule): Promise<void> {
    if (this.modules.has(module.id)) {
      console.warn(`Module ${module.id} is already registered`);
      return;
    }

    const context = this.createContext();

    // Call install hook if present
    if (module.install) {
      await module.install(context);
    }

    // Register module components
    if (module.components) {
      Object.entries(module.components).forEach(([key, component]) => {
        if (component) {
          this.components.set(`${module.id}.${key}`, component);
        }
      });
    }

    // Register slash commands
    if (module.slashCommands) {
      module.slashCommands.forEach(command => {
        this.slashCommands.set(command.command.toLowerCase(), { command, module });
        // Register aliases
        if (command.aliases) {
          command.aliases.forEach(alias => {
            this.slashCommands.set(alias.toLowerCase(), { command, module });
          });
        }
      });
    }

    this.modules.set(module.id, module);
    console.log(`Module ${module.id} registered successfully`);
  }

  /**
   * Unregister a module
   */
  async unregister(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      console.warn(`Module ${moduleId} not found`);
      return;
    }

    const context = this.createContext();

    // Call uninstall hook if present
    if (module.uninstall) {
      await module.uninstall(context);
    }

    // Remove module components
    const componentKeys = Array.from(this.components.keys()).filter((key) =>
      key.startsWith(`${moduleId}.`)
    );
    componentKeys.forEach((key) => this.components.delete(key));

    this.modules.delete(moduleId);
    console.log(`Module ${moduleId} unregistered successfully`);
  }

  /**
   * Get a registered module
   */
  getModule(moduleId: string): NoteModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): NoteModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules that support a specific note type
   */
  getModulesForType(type: NoteType | string): NoteModule[] {
    // First check if it's a module ID (for view-only modules like caesar-cipher)
    const moduleById = this.modules.get(type);
    if (moduleById) {
      return [moduleById];
    }

    // Otherwise, find by supported types
    return Array.from(this.modules.values()).filter((module) =>
      module.supportedTypes.includes(type as NoteType)
    );
  }

  /**
   * Get a module by its ID
   */
  getModuleById(moduleId: string): NoteModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Register a note type handler
   */
  registerTypeHandler(type: NoteType, handler: NoteTypeHandler): void {
    this.typeHandlers.set(type, handler);
  }

  /**
   * Get a note type handler
   */
  getTypeHandler(type: NoteType): NoteTypeHandler | undefined {
    return this.typeHandlers.get(type);
  }

  /**
   * Check if a note type handler is registered
   */
  hasTypeHandler(type: NoteType | string): boolean {
    return this.typeHandlers.has(type as NoteType);
  }

  /**
   * Get all registered note types
   */
  getRegisteredNoteTypes(): NoteType[] {
    return Array.from(this.typeHandlers.keys());
  }

  /**
   * Get all registered slash commands
   */
  getAllSlashCommands(): Array<{ command: SlashCommand; module: NoteModule }> {
    const uniqueCommands = new Map<string, { command: SlashCommand; module: NoteModule }>();
    
    // Get unique commands (primary commands only, not aliases)
    this.slashCommands.forEach((value, key) => {
      if (key === value.command.command.toLowerCase()) {
        uniqueCommands.set(key, value);
      }
    });
    
    return Array.from(uniqueCommands.values());
  }

  /**
   * Get slash command by command string
   */
  getSlashCommand(command: string): { command: SlashCommand; module: NoteModule } | undefined {
    return this.slashCommands.get(command.toLowerCase());
  }

  /**
   * Get module parameters for a note type
   */
  getParametersForType(type: NoteType): any[] {
    const modules = this.getModulesForType(type);
    return modules.flatMap(m => m.parameters || []);
  }

  /**
   * Register a component
   */
  registerComponent(name: string, component: Component): void {
    this.components.set(name, component);
  }

  /**
   * Get a registered component
   */
  getComponent(name: string): Component | undefined {
    return this.components.get(name);
  }

  /**
   * Register an action
   */
  registerAction(action: NoteAction): void {
    this.actions.set(action.id, action);
  }

  /**
   * Get all actions applicable to a note
   */
  getActionsForNote(note: any): NoteAction[] {
    return Array.from(this.actions.values()).filter((action) =>
      action.appliesTo(note)
    );
  }

  /**
   * Register a transform
   */
  registerTransform(transform: TransformDefinition): void {
    this.transforms.set(transform.id, transform);
  }

  /**
   * Get all transforms applicable to a note type
   */
  getTransformsForType(type: NoteType): TransformDefinition[] {
    return Array.from(this.transforms.values()).filter((transform) =>
      transform.inputTypes.includes(type)
    );
  }

  /**
   * Register a store
   */
  registerStore(name: string, store: any): void {
    this.stores.set(name, store);
  }

  /**
   * Register a service
   */
  registerService(name: string, service: any): void {
    this.services.set(name, service);
  }

  /**
   * Create a module context
   */
  private createContext(): ModuleContext {
    return {
      registerNoteType: (type, handler) =>
        this.registerTypeHandler(type, handler),
      registerComponent: (name, component) =>
        this.registerComponent(name, component),
      registerAction: (action) => this.registerAction(action),
      registerTransform: (transform) => this.registerTransform(transform),
      getStore: <T = any>(name: string): T => this.stores.get(name),
      getService: <T = any>(name: string): T => this.services.get(name),
    };
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.modules.clear();
    this.typeHandlers.clear();
    this.components.clear();
    this.actions.clear();
    this.transforms.clear();
    this.stores.clear();
    this.services.clear();
  }
}

// Singleton instance
export const moduleRegistry = new ModuleRegistry();

// Convenience exports
export function registerModule(module: NoteModule) {
  return moduleRegistry.register(module);
}

export function getModulesForType(type: NoteType | string) {
  return moduleRegistry.getModulesForType(type);
}

export function getModuleById(moduleId: string) {
  return moduleRegistry.getModuleById(moduleId);
}

export function getTypeHandler(type: NoteType) {
  return moduleRegistry.getTypeHandler(type);
}
