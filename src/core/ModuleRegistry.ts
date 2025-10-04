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
  getModulesForType(type: NoteType): NoteModule[] {
    return Array.from(this.modules.values()).filter((module) =>
      module.supportedTypes.includes(type)
    );
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
  }
}

// Singleton instance
export const moduleRegistry = new ModuleRegistry();
