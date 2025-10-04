/**
 * Central registry for managing note modules on the backend
 */

import type {
  NoteModule,
  ModuleContext,
  NoteTypeHandler,
} from "../types/module.js";
import type { NoteType } from "../types/note.js";
import type { FastifyInstance } from "fastify";

class ModuleRegistry {
  private modules = new Map<string, NoteModule>();
  private typeHandlers = new Map<NoteType, NoteTypeHandler>();
  private services = new Map<string, any>();
  private fastify?: FastifyInstance;

  /**
   * Initialize the registry with Fastify instance
   */
  initialize(fastify: FastifyInstance): void {
    this.fastify = fastify;
  }

  /**
   * Register a new module
   */
  async register(module: NoteModule): Promise<void> {
    if (this.modules.has(module.id)) {
      this.log(`Module ${module.id} is already registered`, "warn");
      return;
    }

    const context = this.createContext();

    // Call install hook if present
    if (module.install) {
      await module.install(context);
    }

    this.modules.set(module.id, module);
    this.log(`Module ${module.id} registered successfully`);
  }

  /**
   * Unregister a module
   */
  async unregister(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      this.log(`Module ${moduleId} not found`, "warn");
      return;
    }

    const context = this.createContext();

    // Call uninstall hook if present
    if (module.uninstall) {
      await module.uninstall(context);
    }

    this.modules.delete(moduleId);
    this.log(`Module ${moduleId} unregistered successfully`);
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
    this.log(`Type handler registered for: ${type}`);
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
   * Register a service
   */
  registerService<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * Get a registered service
   */
  getService<T>(name: string): T | undefined {
    return this.services.get(name);
  }

  /**
   * Clear all modules (for testing)
   */
  clear(): void {
    this.modules.clear();
    this.typeHandlers.clear();
  }

  /**
   * Create module context for dependency injection
   */
  private createContext(): ModuleContext {
    return {
      registerTypeHandler: this.registerTypeHandler.bind(this),
      getService: <T = any>(name: string): T => {
        const service = this.services.get(name);
        if (!service) {
          throw new Error(`Service not found: ${name}`);
        }
        return service as T;
      },
      log: this.log.bind(this),
    };
  }

  /**
   * Log messages
   */
  private log(
    message: string,
    level: "info" | "warn" | "error" = "info"
  ): void {
    if (this.fastify) {
      this.fastify.log[level](message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }
}

// Singleton instance
export const moduleRegistry = new ModuleRegistry();
