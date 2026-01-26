/**
 * Plugin System - Extensibility framework for third-party integrations
 * Supports custom analytics, UI extensions, game modes, and middleware
 */

export type PluginType = 'analytics' | 'ui' | 'game-mode' | 'middleware' | 'theme';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  author: string;
  description?: string;
  dependencies?: string[];
  permissions?: string[];
}

export interface PluginContext {
  config: Record<string, unknown>;
  emit: (event: string, data?: unknown) => void;
  subscribe: (event: string, handler: (data: unknown) => void) => () => void;
  storage: {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
  };
}

export interface Plugin {
  manifest: PluginManifest;
  init: (context: PluginContext) => Promise<void>;
  destroy?: () => Promise<void>;
  onEvent?: (event: string, data: unknown) => void;
}

export interface PluginHooks {
  beforeMatchStart?: (matchData: unknown) => Promise<unknown>;
  afterMatchEnd?: (result: unknown) => Promise<void>;
  onPlayerAction?: (action: unknown) => Promise<void>;
  renderUI?: () => React.ReactNode;
}

/** Type-safe event handler for plugins */
export type EventHandler = (data: unknown) => void | Promise<void>;

/** Type-safe hook handler for plugins */
export type HookHandler = (data?: unknown) => unknown | Promise<unknown>;

import { CustomError, ErrorCode, ErrorSeverity } from '@/lib/errors';
import { getErrorHandler, logBreadcrumb } from '@/lib/errorHandler';

/**
 * PluginSystem - Core extensibility framework
 * 
 * Provides a robust plugin architecture for third-party extensions with:
 * - Type-safe event handling and hooks
 * - Dependency management and validation
 * - Isolated plugin contexts with storage
 * - Comprehensive error handling
 * 
 * @example
 * ```ts
 * await pluginSystem.register(myPlugin);
 * pluginSystem.emit('game.start', { matchId: '123' });
 * ```
 */
class PluginSystem {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, Set<HookHandler>> = new Map();
  private eventBus: Map<string, Set<EventHandler>> = new Map();
  private storage: Map<string, Map<string, unknown>> = new Map();
  private errorHandler = getErrorHandler();

  /**
   * Register a new plugin in the system
   * 
   * Validates the plugin manifest, checks dependencies, initializes the plugin
   * with an isolated context, and handles any initialization errors.
   * 
   * @param plugin - The plugin to register
   * @returns Promise<boolean> - True if registration successful, false otherwise
   * 
   * @throws {CustomError} If plugin initialization fails catastrophically
   * 
   * @example
   * ```ts
   * const success = await pluginSystem.register({
   *   manifest: { id: 'my-plugin', name: 'My Plugin', version: '1.0.0', type: 'analytics', author: 'Me' },
   *   init: async (context) => { console.log('Initialized!'); }
   * });
   * ```
   */
  async register(plugin: Plugin): Promise<boolean> {
    const { id } = plugin.manifest;

    if (this.plugins.has(id)) {
      console.warn(`[PluginSystem] Plugin "${id}" is already registered`);
      return false;
    }

    // Validate manifest
    if (!this.validateManifest(plugin.manifest)) {
      console.error(`[PluginSystem] Invalid manifest for plugin "${id}"`);
      return false;
    }

    // Check dependencies
    if (plugin.manifest.dependencies) {
      for (const depId of plugin.manifest.dependencies) {
        if (!this.plugins.has(depId)) {
          console.error(`Plugin ${id} requires ${depId} which is not installed`);
          return false;
        }
      }
    }

    // Create plugin context
    const context = this.createContext(id);

    try {
      await plugin.init(context);
      this.plugins.set(id, plugin);
      logBreadcrumb('plugin', 'info', `Registered plugin ${id}`, { id, type: plugin.manifest.type });
      console.log(`Plugin ${id} registered successfully`);
      return true;
    } catch (error) {
      this.errorHandler.handleError(
        new CustomError(
          `Failed to initialize plugin ${id}`,
          ErrorCode.INTERNAL_ERROR,
          ErrorSeverity.HIGH,
          { id, error }
        )
      );
      return false;
    }
  }

  /**
   * Unregister and cleanup a plugin
   * 
   * Calls the plugin's destroy lifecycle hook, removes it from the registry,
   * and cleans up its storage.
   * 
   * @param pluginId - The ID of the plugin to unregister
   * @returns Promise<boolean> - True if unregistration successful, false if plugin not found
   * 
   * @example
   * ```ts
   * await pluginSystem.unregister('my-plugin');
   * ```
   */
  async unregister(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`[PluginSystem] Cannot unregister: plugin "${pluginId}" not found`);
      return false;
    }

    try {
      if (plugin.destroy) {
        await plugin.destroy();
      }
      this.plugins.delete(pluginId);
      this.storage.delete(pluginId);
      console.log(`Plugin ${pluginId} unregistered`);
      return true;
    } catch (error) {
      this.errorHandler.handleError(
        new CustomError(
          `Failed to destroy plugin ${pluginId}`,
          ErrorCode.INTERNAL_ERROR,
          ErrorSeverity.MEDIUM,
          { pluginId, error }
        )
      );
      return false;
    }
  }

  /**
   * Execute hook for all registered plugins
   */
  async executeHook(hookName: string, data?: unknown): Promise<unknown[]> {
    const results: unknown[] = [];
    const handlers = this.hooks.get(hookName) || new Set();

    for (const handler of handlers) {
      try {
        const result = await handler(data);
        results.push(result);
      } catch (error) {
        this.errorHandler.handleError(
          new CustomError(
            `Error executing hook ${hookName}`,
            ErrorCode.INTERNAL_ERROR,
            ErrorSeverity.MEDIUM,
            { hookName, error }
          )
        );
      }
    }

    return results;
  }

  /**
   * Register a hook handler
   * 
   * Hooks allow plugins to intercept and modify data at key execution points.
   * 
   * @param hookName - Name of the hook (e.g., 'beforeMatchStart')
   * @param handler - Function to execute when hook is triggered
   * 
   * @example
   * ```ts
   * pluginSystem.registerHook('beforeMatchStart', async (matchData) => {
   *   return { ...matchData, modified: true };
   * });
   * ```
   */
  registerHook(hookName: string, handler: HookHandler): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new Set());
    }
    this.hooks.get(hookName)!.add(handler);
    logBreadcrumb('plugin', 'info', `Hook registered: ${hookName}`, { hookName });
  }

  /**
   * Unregister a hook handler
   * 
   * @param hookName - Name of the hook
   * @param handler - The exact handler function to remove
   */
  unregisterHook(hookName: string, handler: HookHandler): void {
    const handlers = this.hooks.get(hookName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all registered plugins and subscribers
   * 
   * Events are broadcast to both the event bus subscribers and plugins
   * that implement the onEvent handler.
   * 
   * @param event - Event name (e.g., 'match.end', 'player.scored')
   * @param data - Optional event payload
   * 
   * @example
   * ```ts
   * pluginSystem.emit('match.end', { score: { home: 2, away: 1 } });
   * ```
   */
  emit(event: string, data?: unknown): void {
    // Notify via event bus
    const subscribers = this.eventBus.get(event) || new Set();
    subscribers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        this.errorHandler.handleError(
          new CustomError(
            `Error in event handler for ${event}`,
            ErrorCode.INTERNAL_ERROR,
            ErrorSeverity.MEDIUM,
            { event, error }
          )
        );
      }
    });

    // Notify plugins with onEvent
    this.plugins.forEach(plugin => {
      if (plugin.onEvent) {
        try {
          plugin.onEvent(event, data);
        } catch (error) {
          this.errorHandler.handleError(
            new CustomError(
              `Error in plugin ${plugin.manifest.id} onEvent`,
              ErrorCode.INTERNAL_ERROR,
              ErrorSeverity.MEDIUM,
              { pluginId: plugin.manifest.id, event, error }
            )
          );
        }
      }
    });
  }

  /**
   * Subscribe to events
   * 
   * @param event - Event name to listen for
   * @param handler - Callback function to execute when event is emitted
   * @returns Unsubscribe function
   * 
   * @example
   * ```ts
   * const unsubscribe = pluginSystem.subscribe('match.end', (data) => {
   *   console.log('Match ended:', data);
   * });
   * // Later: unsubscribe();
   * ```
   */
  subscribe(event: string, handler: EventHandler): () => void {
    if (!this.eventBus.has(event)) {
      this.eventBus.set(event, new Set());
    }
    this.eventBus.get(event)!.add(handler);

    return () => {
      const subscribers = this.eventBus.get(event);
      if (subscribers) {
        subscribers.delete(handler);
      }
    };
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * List all registered plugins
   */
  listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(p => p.manifest);
  }

  /**
   * Get plugins by type
   */
  getPluginsByType(type: PluginType): Plugin[] {
    return Array.from(this.plugins.values()).filter(
      p => p.manifest.type === type
    );
  }

  private validateManifest(manifest: PluginManifest): boolean {
    return !!(
      manifest.id &&
      manifest.name &&
      manifest.version &&
      manifest.type &&
      manifest.author
    );
  }

  private createContext(pluginId: string): PluginContext {
    if (!this.storage.has(pluginId)) {
      this.storage.set(pluginId, new Map());
    }
    const pluginStorage = this.storage.get(pluginId)!;

    return {
      config: {},
      emit: (event: string, data?: unknown) => this.emit(`plugin:${pluginId}:${event}`, data),
      subscribe: (event: string, handler: (data: unknown) => void) => 
        this.subscribe(`plugin:${pluginId}:${event}`, handler),
      storage: {
        get: (key: string) => pluginStorage.get(key),
        set: (key: string, value: unknown) => pluginStorage.set(key, value),
      },
    };
  }
}

export const pluginSystem = new PluginSystem();

export default pluginSystem;

// Example plugin implementation
export const exampleAnalyticsPlugin: Plugin = {
  manifest: {
    id: 'analytics-example',
    name: 'Example Analytics',
    version: '1.0.0',
    type: 'analytics',
    author: 'Bass Ball Team',
    description: 'Example analytics plugin',
  },
  async init(context) {
    console.log('Analytics plugin initialized');
    context.subscribe('match.end', (data) => {
      console.log('Match ended:', data);
    });
  },
  onEvent(event, data) {
    if (event.startsWith('game.')) {
      console.log('Game event:', event, data);
    }
  },
};
