import { useNotesStore } from "@/stores/notes";
import type { Note } from "@/types/note";
import {
  isTextNote,
  isMarkdownNote,
  isCodeNote,
  isRichTextNote,
} from "@/types/note";

export function useDataExport() {
  const notesStore = useNotesStore();

  async function exportToJSON() {
    const data = notesStore.exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function exportToText() {
    const notes = notesStore.notes as Note[];
    const text = notes
      .map((note: Note) => {
        const date = new Date(note.created).toLocaleString();
        const category = note.category ? `[${note.category}]` : "";
        const tags = note.tags?.length
          ? note.tags.map((t: string) => `#${t}`).join(" ")
          : "";
        return `${date} ${category} ${tags}\n${renderNoteContent(
          note
        )}\n${"=".repeat(50)}\n`;
      })
      .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-export-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function importFromJSON(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      return notesStore.importData(data);
    } catch (error) {
      console.error("Import failed:", error);
      return false;
    }
  }

  async function importFromFile(): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const success = await importFromJSON(file);
          resolve(success);
        } else {
          resolve(false);
        }
      };

      input.click();
    });
  }

  function renderNoteContent(note: Note): string {
    if (isTextNote(note)) {
      return note.text;
    }

    if (isMarkdownNote(note)) {
      return note.markdown;
    }

    if (isCodeNote(note)) {
      return note.code;
    }

    if (isRichTextNote(note)) {
      if (typeof note.html === "string" && note.html.trim().length > 0) {
        return note.html;
      }
      return JSON.stringify(note.content ?? {}, null, 2);
    }

    return JSON.stringify(note, null, 2);
  }

  return {
    exportToJSON,
    exportToText,
    importFromJSON,
    importFromFile,
  };
}
