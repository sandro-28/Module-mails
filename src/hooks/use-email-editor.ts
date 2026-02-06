"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditorStore } from "@/stores/editor-store";
import type { TemplateBlock, BlockType } from "@/types/template";

export function useEmailEditor() {
  const store = useEditorStore();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save every 30 seconds when dirty
  useEffect(() => {
    if (store.isDirty) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        // Trigger auto-save callback
        // This would call a server action to save the template
        store.markClean();
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [store.isDirty, store]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        store.redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (
          store.selectedBlockId &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          store.removeBlock(store.selectedBlockId);
        }
      }
      if (e.key === "Escape") {
        store.selectBlock(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [store]);

  const createBlock = useCallback(
    (type: BlockType): TemplateBlock => {
      const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const defaultContent: Record<string, unknown> = {};
      const defaultStyles: Record<string, string | number> = {};

      switch (type) {
        case "text":
          defaultContent.html = "<p>Enter your text here...</p>";
          defaultStyles.padding = "10px 20px";
          break;
        case "image":
          defaultContent.src = "";
          defaultContent.alt = "";
          defaultContent.width = 600;
          defaultStyles.textAlign = "center";
          break;
        case "button":
          defaultContent.text = "Click Here";
          defaultContent.url = "#";
          defaultStyles.backgroundColor = "#6366f1";
          defaultStyles.color = "#ffffff";
          defaultStyles.borderRadius = "6px";
          defaultStyles.padding = "12px 24px";
          defaultStyles.textAlign = "center";
          break;
        case "divider":
          defaultStyles.borderTop = "1px solid #e5e7eb";
          defaultStyles.margin = "20px 0";
          break;
        case "spacer":
          defaultStyles.height = "20px";
          break;
        case "header":
          defaultContent.logoUrl = "";
          defaultContent.title = "Header";
          defaultStyles.backgroundColor = "#1f2937";
          defaultStyles.color = "#ffffff";
          defaultStyles.padding = "20px";
          break;
        case "footer":
          defaultContent.text =
            "{{organization.name}} | {{unsubscribe_url}}";
          defaultStyles.fontSize = "12px";
          defaultStyles.color = "#6b7280";
          defaultStyles.textAlign = "center";
          defaultStyles.padding = "20px";
          break;
        case "social":
          defaultContent.networks = ["facebook", "twitter", "instagram"];
          defaultStyles.textAlign = "center";
          break;
        default:
          break;
      }

      return {
        id,
        type,
        content: defaultContent,
        styles: defaultStyles,
        order: store.blocks.length,
      };
    },
    [store.blocks.length]
  );

  const addBlockOfType = useCallback(
    (type: BlockType, index?: number) => {
      const block = createBlock(type);
      store.addBlock(block, index);
      store.selectBlock(block.id);
    },
    [createBlock, store]
  );

  return {
    ...store,
    createBlock,
    addBlockOfType,
  };
}
