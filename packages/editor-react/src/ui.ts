import {
  getHelbaronDocumentLinksState,
  getHelbaronSlashMenuState,
  listHelbaronUi,
  type HelbaronDocumentLinksState,
  type HelbaronSlashMenuState,
  type HelbaronUiAction,
  type HelbaronUiPlacement,
} from "@helbaron/editor/codemirror";
import { useEffect, useMemo, useState } from "react";
import { useHelbaronEditorContext } from "./HelbaronEditorProvider.tsx";

const emptyActions: readonly HelbaronUiAction[] = [];
const emptySlashMenu: HelbaronSlashMenuState = {
  actions: emptyActions,
  from: null,
  open: false,
  query: "",
  selectedIndex: 0,
  source: null,
  to: null,
};
const emptyDocumentLinks: HelbaronDocumentLinksState = {
  from: null,
  items: [],
  open: false,
  query: "",
  selectedIndex: 0,
  to: null,
};

export interface HelbaronEditorSelectionToolbarState {
  readonly actions: readonly HelbaronUiAction[];
  readonly from: number | null;
  readonly open: boolean;
  readonly to: number | null;
}

export interface HelbaronEditorUiAnchor {
  readonly left: number;
  readonly top: number;
}

type AnchorMode = "caret" | "selection";

function useMeasuredAnchor(
  from: number | null,
  to: number | null,
  mode: AnchorMode,
) {
  const { revision, view } = useHelbaronEditorContext();
  const [anchor, setAnchor] = useState<HelbaronEditorUiAnchor | null>(null);

  useEffect(() => {
    let active = true;
    if (!view || from === null || to === null) {
      setAnchor(null);
      return () => {
        active = false;
      };
    }

    view.requestMeasure({
      read(editor) {
        return {
          end: editor.coordsAtPos(to),
          start: editor.coordsAtPos(from),
        };
      },
      write(measurement) {
        if (!active) return;
        if (!measurement.start || !measurement.end) {
          setAnchor(null);
          return;
        }
        setAnchor(
          mode === "caret"
            ? {
                left: measurement.end.left,
                top: measurement.end.bottom + 8,
              }
            : {
                left: (measurement.start.left + measurement.end.right) / 2,
                top: Math.min(measurement.start.top, measurement.end.top) - 8,
              },
        );
      },
    });

    return () => {
      active = false;
    };
  }, [from, mode, revision, to, view]);

  return anchor;
}

export function useHelbaronEditorCaretAnchor(position: number | null) {
  return useMeasuredAnchor(position, position, "caret");
}

export function useHelbaronEditorSelectionAnchor(
  from: number | null,
  to: number | null,
) {
  return useMeasuredAnchor(from, to, "selection");
}

export function useHelbaronEditorUi(placement: HelbaronUiPlacement) {
  const { revision, view } = useHelbaronEditorContext();
  return useMemo(
    () => (view ? listHelbaronUi(view, placement) : emptyActions),
    [placement, revision, view],
  );
}

export function useHelbaronEditorSlashMenu() {
  const { revision, view } = useHelbaronEditorContext();
  return useMemo(
    () => (view ? getHelbaronSlashMenuState(view) : emptySlashMenu),
    [revision, view],
  );
}

export function useHelbaronEditorDocumentLinks() {
  const { revision, view } = useHelbaronEditorContext();
  return useMemo(
    () => (view ? getHelbaronDocumentLinksState(view) : emptyDocumentLinks),
    [revision, view],
  );
}

export function useHelbaronEditorSelectionToolbar(): HelbaronEditorSelectionToolbarState {
  const { revision, view } = useHelbaronEditorContext();
  return useMemo(() => {
    if (!view) {
      return { actions: emptyActions, from: null, open: false, to: null };
    }

    const actions = listHelbaronUi(view, "selection-toolbar");
    const selection = view.state.selection.main;
    const open = !selection.empty && actions.some((action) => action.enabled);
    return {
      actions,
      from: open ? selection.from : null,
      open,
      to: open ? selection.to : null,
    };
  }, [revision, view]);
}
