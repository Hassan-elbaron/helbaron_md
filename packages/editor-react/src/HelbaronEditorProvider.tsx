import type { EditorView } from "@codemirror/view";
import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getHelbaronEditorReactStore } from "./bridge.ts";

interface HelbaronEditorContextValue {
  revision: number;
  view: EditorView | null;
}

export interface HelbaronEditorProviderProps {
  children?: ReactNode;
  view: EditorView | null;
}

const HelbaronEditorContext = createContext<HelbaronEditorContextValue | null>(null);
const emptySubscribe = (_listener: () => unknown) => () => false;
const emptySnapshot = () => 0;

export function HelbaronEditorProvider({
  children,
  view,
}: HelbaronEditorProviderProps) {
  const store = view ? getHelbaronEditorReactStore(view) : null;
  const revision = useSyncExternalStore(
    store?.subscribe ?? emptySubscribe,
    store?.getSnapshot ?? emptySnapshot,
    emptySnapshot,
  );
  const value = useMemo(() => ({ revision, view }), [revision, view]);

  return (
    <HelbaronEditorContext.Provider value={value}>
      {children}
    </HelbaronEditorContext.Provider>
  );
}

export function useHelbaronEditorContext() {
  const context = useContext(HelbaronEditorContext);
  if (!context) {
    throw new Error(
      "Helbaron editor React hooks must be used inside HelbaronEditorProvider",
    );
  }
  return context;
}

export function useHelbaronEditorView() {
  return useHelbaronEditorContext().view;
}
