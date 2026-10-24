import { Facet, type EditorState, type Extension } from "@codemirror/state";
import {
  keymap,
  type EditorView,
  type KeyBinding,
} from "@codemirror/view";

export type HelbaronUiPlacement =
  | "toolbar"
  | "selection-toolbar"
  | "slash-menu"
  | "context-menu";

export type HelbaronKeyBinding = Omit<KeyBinding, "any" | "run" | "shift">;

export interface HelbaronCommandContext {
  readonly query?: string;
  readonly source?: "slash-menu" | "ui";
}

export interface HelbaronCommand {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly keybindings?: readonly HelbaronKeyBinding[];
  readonly isActive?: (view: EditorView) => boolean;
  readonly isEnabled?: (view: EditorView) => boolean;
  readonly run: (view: EditorView, context?: HelbaronCommandContext) => boolean;
}

export interface HelbaronUiContribution {
  readonly command: string;
  readonly placement: HelbaronUiPlacement;
  readonly label?: string;
  readonly icon?: string;
  readonly group?: string;
  readonly keywords?: readonly string[];
  readonly order?: number;
  readonly when?: (view: EditorView) => boolean;
}

export interface HelbaronPlugin {
  readonly id: string;
  readonly extension?: Extension;
  readonly commands?: readonly HelbaronCommand[];
  readonly ui?: readonly HelbaronUiContribution[];
}

export interface HelbaronUiAction {
  readonly active: boolean;
  readonly command: string;
  readonly description?: string;
  readonly enabled: boolean;
  readonly group?: string;
  readonly icon?: string;
  readonly keywords: readonly string[];
  readonly label: string;
  readonly order: number;
  readonly placement: HelbaronUiPlacement;
  readonly plugin: string;
  run: () => boolean;
}

interface RegisteredCommand {
  command: HelbaronCommand;
  plugin: string;
}

interface HelbaronRegistry {
  commands: ReadonlyMap<string, RegisteredCommand>;
  plugins: readonly HelbaronPlugin[];
  ui: readonly HelbaronUiContribution[];
}

function createRegistry(plugins: readonly HelbaronPlugin[]): HelbaronRegistry {
  const pluginIds = new Set<string>();
  const commands = new Map<string, RegisteredCommand>();
  const ui: HelbaronUiContribution[] = [];

  for (const plugin of plugins) {
    if (pluginIds.has(plugin.id)) {
      throw new Error(`Duplicate Helbaron plugin id "${plugin.id}"`);
    }
    pluginIds.add(plugin.id);

    for (const command of plugin.commands ?? []) {
      if (commands.has(command.id)) {
        throw new Error(`Duplicate Helbaron command id "${command.id}"`);
      }
      commands.set(command.id, { command, plugin: plugin.id });
    }

    ui.push(...(plugin.ui ?? []));
  }

  for (const contribution of ui) {
    if (!commands.has(contribution.command)) {
      throw new Error(
        `Unknown Helbaron command id "${contribution.command}" in UI contribution`,
      );
    }
  }

  return { commands, plugins: [...plugins], ui };
}

const registryFacet = Facet.define<HelbaronPlugin, HelbaronRegistry>({
  combine: createRegistry,
});

export function defineHelbaronPlugin(plugin: HelbaronPlugin): HelbaronPlugin {
  if (!plugin.id.trim()) {
    throw new Error("Helbaron plugin id must not be empty");
  }
  return plugin;
}

export function helbaronPlugins(
  plugins: readonly HelbaronPlugin[],
): Extension {
  const bindings: KeyBinding[] = [];

  for (const plugin of plugins) {
    for (const command of plugin.commands ?? []) {
      for (const binding of command.keybindings ?? []) {
        bindings.push({
          ...binding,
          run: (view) => runHelbaronCommand(view, command.id),
        });
      }
    }
  }

  return [
    plugins.map((plugin) => [
      registryFacet.of(plugin),
      plugin.extension ?? [],
    ]),
    bindings.length > 0 ? keymap.of(bindings) : [],
  ];
}

export function listHelbaronPlugins(
  state: EditorState,
): readonly HelbaronPlugin[] {
  return state.facet(registryFacet).plugins;
}

export function runHelbaronCommand(
  view: EditorView,
  id: string,
  context?: HelbaronCommandContext,
) {
  const registered = view.state.facet(registryFacet).commands.get(id);
  if (!registered) return false;
  if (registered.command.isEnabled?.(view) === false) return false;
  return registered.command.run(view, context);
}

export function listHelbaronUi(
  view: EditorView,
  placement: HelbaronUiPlacement,
): HelbaronUiAction[] {
  const registry = view.state.facet(registryFacet);

  return registry.ui
    .filter(
      (contribution) =>
        contribution.placement === placement && contribution.when?.(view) !== false,
    )
    .map((contribution) => {
      const registered = registry.commands.get(contribution.command);
      if (!registered) {
        throw new Error(`Unknown Helbaron command id "${contribution.command}"`);
      }

      const { command, plugin } = registered;
      return {
        active: command.isActive?.(view) ?? false,
        command: command.id,
        description: command.description,
        enabled: command.isEnabled?.(view) ?? true,
        group: contribution.group,
        icon: contribution.icon,
        keywords: contribution.keywords ?? [],
        label: contribution.label ?? command.label,
        order: contribution.order ?? 0,
        placement: contribution.placement,
        plugin,
        run: () => runHelbaronCommand(view, command.id, { source: "ui" }),
      };
    })
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));
}

function normalizedSearchText(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/gu, "");
}

export function searchHelbaronUi(
  view: EditorView,
  placement: HelbaronUiPlacement,
  query: string,
) {
  const actions = listHelbaronUi(view, placement);
  const normalizedQuery = normalizedSearchText(query);
  if (!normalizedQuery) return actions;

  return actions.filter((action) =>
    [
      action.command,
      action.description ?? "",
      action.group ?? "",
      action.label,
      action.plugin,
      ...action.keywords,
    ].some((candidate) =>
      normalizedSearchText(candidate).includes(normalizedQuery),
    ),
  );
}
