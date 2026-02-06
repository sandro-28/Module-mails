import { create } from "zustand";
import type { TemplateBlock } from "@/types/template";

interface EditorState {
  blocks: TemplateBlock[];
  selectedBlockId: string | null;
  previewMode: "desktop" | "mobile" | "tablet";
  isCodeMode: boolean;
  htmlSource: string;
  isDirty: boolean;
  history: TemplateBlock[][];
  historyIndex: number;

  // Global styles
  globalStyles: {
    backgroundColor: string;
    contentBackgroundColor: string;
    fontFamily: string;
    maxWidth: number;
    padding: number;
  };

  // Actions
  setBlocks: (blocks: TemplateBlock[]) => void;
  addBlock: (block: TemplateBlock, index?: number) => void;
  updateBlock: (id: string, updates: Partial<TemplateBlock>) => void;
  removeBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  selectBlock: (id: string | null) => void;
  setPreviewMode: (mode: "desktop" | "mobile" | "tablet") => void;
  toggleCodeMode: () => void;
  setHtmlSource: (html: string) => void;
  setGlobalStyles: (styles: Partial<EditorState["globalStyles"]>) => void;
  undo: () => void;
  redo: () => void;
  markClean: () => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,
  previewMode: "desktop",
  isCodeMode: false,
  htmlSource: "",
  isDirty: false,
  history: [[]],
  historyIndex: 0,
  globalStyles: {
    backgroundColor: "#f4f4f5",
    contentBackgroundColor: "#ffffff",
    fontFamily: "Arial, Helvetica, sans-serif",
    maxWidth: 600,
    padding: 20,
  },

  setBlocks: (blocks) => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(blocks);
    set({ blocks, isDirty: true, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  addBlock: (block, index) => {
    const state = get();
    const blocks = [...state.blocks];
    if (index !== undefined) {
      blocks.splice(index, 0, block);
    } else {
      blocks.push(block);
    }
    // Reorder
    blocks.forEach((b, i) => (b.order = i));
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(blocks);
    set({ blocks, isDirty: true, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  updateBlock: (id, updates) => {
    const state = get();
    const blocks = state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(blocks);
    set({ blocks, isDirty: true, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  removeBlock: (id) => {
    const state = get();
    const blocks = state.blocks.filter((b) => b.id !== id);
    blocks.forEach((b, i) => (b.order = i));
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(blocks);
    set({
      blocks,
      isDirty: true,
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  moveBlock: (fromIndex, toIndex) => {
    const state = get();
    const blocks = [...state.blocks];
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);
    blocks.forEach((b, i) => (b.order = i));
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(blocks);
    set({ blocks, isDirty: true, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  selectBlock: (id) => set({ selectedBlockId: id }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  toggleCodeMode: () => set((s) => ({ isCodeMode: !s.isCodeMode })),
  setHtmlSource: (html) => set({ htmlSource: html, isDirty: true }),
  setGlobalStyles: (styles) =>
    set((s) => ({ globalStyles: { ...s.globalStyles, ...styles }, isDirty: true })),

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({ blocks: state.history[newIndex], historyIndex: newIndex, isDirty: true });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({ blocks: state.history[newIndex], historyIndex: newIndex, isDirty: true });
    }
  },

  markClean: () => set({ isDirty: false }),
  reset: () =>
    set({
      blocks: [],
      selectedBlockId: null,
      isCodeMode: false,
      htmlSource: "",
      isDirty: false,
      history: [[]],
      historyIndex: 0,
    }),
}));
