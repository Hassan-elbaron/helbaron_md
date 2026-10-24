import {
  ViewPlugin,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";

type StoreListener = () => unknown;

class HelbaronEditorReactStore {
  private readonly listeners = new Set<StoreListener>();
  private revision = 0;

  readonly getSnapshot = () => this.revision;

  readonly subscribe = (listener: StoreListener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  update(update: ViewUpdate) {
    if (
      update.transactions.length === 0 &&
      !update.focusChanged &&
      !update.viewportChanged
    ) {
      return;
    }

    this.revision += 1;
    for (const listener of this.listeners) listener();
  }
}

export const helbaronEditorReactBridge = ViewPlugin.fromClass(
  HelbaronEditorReactStore,
);

export function getHelbaronEditorReactStore(view: EditorView) {
  const store = view.plugin(helbaronEditorReactBridge);
  if (!store) {
    throw new Error(
      "HelbaronEditorProvider requires helbaronEditorReactBridge in the EditorView extensions",
    );
  }
  return store;
}
