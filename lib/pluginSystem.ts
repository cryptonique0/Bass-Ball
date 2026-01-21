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

import { CustomError, ErrorCode, ErrorSeverity } from '@/lib/errors';
import { getErrorHandler, logBreadcrumb } from '@/lib/errorHandler';

class PluginSystem {
  private plugins: Map<string, Plugin> = new Map();
  private hooks: Map<string, Set<Function>> = new Map();
  private eventBus: Map<string, Set<Function>> = new Map();
  private storage: Map<string, Map<string, unknown>> = new Map();
  private errorHandler = getErrorHandler();

  // Register a plugin
  async register(plugin: Plugin): Promise<boolean> {
    const { id } = plugin.manifest;

    if (this.plugins.has(id)) {
      console.warn(`Plugin ${id} already registered`);
      return false;
    }

    // Validate manifest
    if (!this.validateManifest(plugin.manifest)) {
      console.error(`Invalid manifest for plugin ${id}`);
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
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

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
   */
  registerHook(hookName: string, handler: Function): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, new Set());
    }
    this.hooks.get(hookName)!.add(handler);
  }

  /**
   * Unregister a hook handler
   */
  unregisterHook(hookName: string, handler: Function): void {
    const handlers = this.hooks.get(hookName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit event to all plugins
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
   */
  subscribe(event: string, handler: Function): () => void {
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
