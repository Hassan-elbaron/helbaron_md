import {
  Facet,
  type EditorState,
  type Extension,
  type Range,
} from "@codemirror/state";
import type { Decoration, EditorView } from "@codemirror/view";
import type { RevealScope } from "./policy.ts";

export interface HelbaronSyntaxNode {
  readonly from: number;
  readonly name: string;
  readonly parent: HelbaronSyntaxNode | null;
  readonly to: number;
  getChild(name: string): HelbaronSyntaxNode | null;
  getChildren(name: string): readonly HelbaronSyntaxNode[];
}

export function helbaronListDepth(node: HelbaronSyntaxNode) {
  let depth = 0;
  let parent = node.parent;
  while (parent) {
    if (parent.name === "ListItem") depth += 1;
    parent = parent.parent;
  }
  return depth;
}

export interface HelbaronRendererContext {
  readonly node: HelbaronSyntaxNode;
  readonly state: EditorState;
  readonly view: EditorView;
  readonly visibleRange: Readonly<{ from: number; to: number }>;
  add(range: Range<Decoration>): unknown;
  revealed(scope?: RevealScope): boolean;
}

export interface HelbaronRenderer {
  readonly id: string;
  readonly nodeNames: readonly string[];
  readonly scope?: HelbaronRendererScope;
  render(context: HelbaronRendererContext): unknown;
}

export type HelbaronRendererScope = "node" | "visible-range";

interface RendererRegistry {
  byNodeName: ReadonlyMap<string, readonly HelbaronRenderer[]>;
}

function createRendererRegistry(
  renderers: readonly HelbaronRenderer[],
): RendererRegistry {
  const ids = new Set<string>();
  const byNodeName = new Map<string, HelbaronRenderer[]>();

  for (const renderer of renderers) {
    if (ids.has(renderer.id)) {
      throw new Error(`Duplicate Helbaron renderer id "${renderer.id}"`);
    }
    ids.add(renderer.id);

    for (const nodeName of renderer.nodeNames) {
      const registered = byNodeName.get(nodeName) ?? [];
      registered.push(renderer);
      byNodeName.set(nodeName, registered);
    }
  }

  return { byNodeName };
}

const rendererFacet = Facet.define<HelbaronRenderer, RendererRegistry>({
  combine: createRendererRegistry,
});

export function helbaronRenderer(renderer: HelbaronRenderer): Extension {
  if (!renderer.id.trim()) {
    throw new Error("Helbaron renderer id must not be empty");
  }
  if (renderer.nodeNames.length === 0) {
    throw new Error(`Helbaron renderer "${renderer.id}" must declare a node name`);
  }
  return rendererFacet.of(renderer);
}

export function getHelbaronRenderers(state: EditorState, nodeName: string) {
  return state.facet(rendererFacet).byNodeName.get(nodeName) ?? [];
}
