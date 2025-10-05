/**
 * View Adapters - Handle displaying any note type in any viewer
 * This provides lossless, type-safe transformations for cross-type viewing
 */

import type { Note, NoteType } from "@/types/note";

export interface ViewAdapter<TNote = Note> {
  /**
   * Check if this adapter can handle the given note
   */
  canAdapt(note: Note): boolean;

  /**
   * Adapt the note data for viewing
   */
  adapt(note: Note): any;

  /**
   * Get a warning message if viewing a different type
   */
  getWarning?(note: Note): string | null;
}

/**
 * Text View Adapter - Shows everything as text
 */
export class TextViewAdapter implements ViewAdapter {
  canAdapt(note: Note): note is Note {
    return true; // Can adapt any note
  }

  adapt(note: Note): { text: string } {
    const n = note as any;

    switch (note.type) {
      case "text":
        return { text: n.text || "" };

      case "markdown":
        return { text: n.markdown || "" };

      case "code":
        return { text: n.code || "" };

      case "rich-text":
        // Strip HTML tags for text view
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = n.html || "";
        return { text: tempDiv.textContent || tempDiv.innerText || "" };

      case "image":
        return { text: `[Image: ${n.alt || n.url || "No content"}]` };

      case "smart-layer":
        return { text: n.source?.data || "" };

      default:
        // Fallback: show raw JSON
        return { text: JSON.stringify(note, null, 2) };
    }
  }

  getWarning(note: Note): string | null {
    return note.type !== "text"
      ? `Viewing ${note.type} note as text. Original data preserved.`
      : null;
  }
}

/**
 * Markdown View Adapter - Shows everything as markdown
 */
export class MarkdownViewAdapter implements ViewAdapter {
  canAdapt(note: Note): note is Note {
    return true;
  }

  adapt(note: Note): { markdown: string; html?: string } {
    const n = note as any;

    switch (note.type) {
      case "markdown":
        return { markdown: n.markdown || "", html: n.html };

      case "text":
        return { markdown: n.text || "" };

      case "code":
        return {
          markdown: `\`\`\`${n.language || "text"}\n${n.code || ""}\n\`\`\``,
        };

      case "rich-text":
        // Convert HTML to markdown (basic)
        return { markdown: n.html || "" };

      case "image":
        return { markdown: `![${n.alt || "Image"}](${n.url || ""})` };

      case "smart-layer":
        return { markdown: n.source?.data || "" };

      default:
        return {
          markdown: `\`\`\`json\n${JSON.stringify(note, null, 2)}\n\`\`\``,
        };
    }
  }

  getWarning(note: Note): string | null {
    return note.type !== "markdown"
      ? `Viewing ${note.type} note as markdown. Original data preserved.`
      : null;
  }
}

/**
 * Code View Adapter - Shows everything as code
 */
export class CodeViewAdapter implements ViewAdapter {
  canAdapt(note: Note): note is Note {
    return true;
  }

  adapt(note: Note): { code: string; language: string; filename?: string } {
    const n = note as any;

    switch (note.type) {
      case "code":
        return {
          code: n.code || "",
          language: n.language || "text",
          filename: n.filename,
        };

      case "text":
        return { code: n.text || "", language: "text" };

      case "markdown":
        return { code: n.markdown || "", language: "markdown" };

      case "rich-text":
        return { code: n.html || "", language: "html" };

      case "image":
        return {
          code: `URL: ${n.url || "N/A"}\nAlt: ${n.alt || "N/A"}`,
          language: "text",
        };

      case "smart-layer":
        return { code: n.source?.data || "", language: "text" };

      default:
        return { code: JSON.stringify(note, null, 2), language: "json" };
    }
  }

  getWarning(note: Note): string | null {
    return note.type !== "code"
      ? `Viewing ${note.type} note as code. Original data preserved.`
      : null;
  }
}

/**
 * Rich Text View Adapter - Shows everything as HTML
 */
export class RichTextViewAdapter implements ViewAdapter {
  canAdapt(note: Note): note is Note {
    return true;
  }

  adapt(note: Note): { html: string; content?: any } {
    const n = note as any;

    switch (note.type) {
      case "rich-text":
        return { html: n.html || "", content: n.content };

      case "text":
        return { html: `<p>${this.escapeHtml(n.text || "")}</p>` };

      case "markdown":
        // Simple markdown to HTML
        return { html: `<pre>${this.escapeHtml(n.markdown || "")}</pre>` };

      case "code":
        return {
          html: `<pre><code>${this.escapeHtml(n.code || "")}</code></pre>`,
        };

      case "image":
        if (n.url) {
          return {
            html: `<img src="${n.url}" alt="${this.escapeHtml(
              n.alt || ""
            )}" />`,
          };
        }
        return {
          html: `<p><em>Image: ${this.escapeHtml(n.alt || "No URL")}</em></p>`,
        };

      case "smart-layer":
        return { html: `<p>${this.escapeHtml(n.source?.data || "")}</p>` };

      default:
        return {
          html: `<pre>${this.escapeHtml(JSON.stringify(note, null, 2))}</pre>`,
        };
    }
  }

  getWarning(note: Note): string | null {
    return note.type !== "rich-text"
      ? `Viewing ${note.type} note as rich-text. Original data preserved.`
      : null;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * Image View Adapter - Shows everything as image or placeholder
 */
export class ImageViewAdapter implements ViewAdapter {
  canAdapt(note: Note): note is Note {
    return true;
  }

  adapt(note: Note): {
    url?: string;
    alt?: string;
    width?: number;
    height?: number;
    fallbackText?: string;
  } {
    const n = note as any;

    switch (note.type) {
      case "image":
        return {
          url: n.url,
          alt: n.alt,
          width: n.width,
          height: n.height,
        };

      case "text":
        // Try to detect if text is a URL
        const text = n.text || "";
        if (this.isImageUrl(text.trim())) {
          return { url: text.trim(), alt: "Image from text" };
        }
        return { fallbackText: text };

      case "markdown":
        // Try to extract image from markdown
        const match = n.markdown?.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          return { url: match[2], alt: match[1] };
        }
        return { fallbackText: n.markdown || "" };

      case "code":
      case "rich-text":
      case "smart-layer":
        return { fallbackText: this.extractText(note) };

      default:
        return { fallbackText: JSON.stringify(note, null, 2) };
    }
  }

  getWarning(note: Note): string | null {
    return note.type !== "image"
      ? `Viewing ${note.type} note as image. Original data preserved.`
      : null;
  }

  private isImageUrl(text: string): boolean {
    return (
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(text) ||
      /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)/i.test(text) ||
      /^data:image\//i.test(text)
    );
  }

  private extractText(note: Note): string {
    const n = note as any;
    switch (note.type) {
      case "text":
        return n.text || "";
      case "markdown":
        return n.markdown || "";
      case "code":
        return n.code || "";
      case "rich-text":
        return n.html || "";
      case "smart-layer":
        return n.source?.data || "";
      default:
        return "";
    }
  }
}

/**
 * Smart Layer View Adapter - Shows everything with transformations
 */
export class SmartLayerViewAdapter implements ViewAdapter {
  canAdapt(note: Note): note is Note {
    return true;
  }

  adapt(note: Note): {
    source: { type: string; data: any };
    layers: any[];
    activeLayerId?: string;
  } {
    const n = note as any;

    switch (note.type) {
      case "smart-layer":
        return {
          source: n.source,
          layers: n.layers || [],
          activeLayerId: n.activeLayerId,
        };

      case "text":
        return {
          source: { type: "text", data: n.text || "" },
          layers: [],
        };

      case "markdown":
        return {
          source: { type: "markdown", data: n.markdown || "" },
          layers: [],
        };

      case "code":
        return {
          source: { type: "code", data: n.code || "" },
          layers: [],
        };

      case "rich-text":
        return {
          source: { type: "html", data: n.html || "" },
          layers: [],
        };

      case "image":
        return {
          source: { type: "image", data: n.url || "" },
          layers: [],
        };

      default:
        return {
          source: { type: "json", data: JSON.stringify(note, null, 2) },
          layers: [],
        };
    }
  }

  getWarning(note: Note): string | null {
    return note.type !== "smart-layer"
      ? `Viewing ${note.type} note as smart-layer. Original data preserved.`
      : null;
  }
}

/**
 * JSON View Adapter - Shows raw JSON for any note (debugging/advanced editing)
 */
export class JsonViewAdapter implements ViewAdapter {
  canAdapt(note: Note): note is Note {
    return true;
  }

  adapt(note: Note): { code: string; language: string } {
    return {
      code: JSON.stringify(note, null, 2),
      language: "json",
    };
  }

  getWarning(): string | null {
    return "Viewing raw JSON. Be careful when editing - invalid JSON will corrupt the note.";
  }
}

/**
 * Adapter Registry - Maps note types to adapters
 */
class AdapterRegistry {
  private adapters = new Map<NoteType | "json", ViewAdapter>();

  constructor() {
    // Register default adapters
    this.register("text", new TextViewAdapter());
    this.register("markdown", new MarkdownViewAdapter());
    this.register("code", new CodeViewAdapter());
    this.register("rich-text", new RichTextViewAdapter());
    this.register("image", new ImageViewAdapter());
    this.register("smart-layer", new SmartLayerViewAdapter());
    this.register("json", new JsonViewAdapter());
  }

  register(type: NoteType | "json", adapter: ViewAdapter): void {
    this.adapters.set(type, adapter);
  }

  getAdapter(type: NoteType | "json"): ViewAdapter | null {
    return this.adapters.get(type) || null;
  }

  adaptNote(
    note: Note,
    viewAs: NoteType | "json"
  ): { data: any; warning: string | null } {
    const adapter = this.getAdapter(viewAs);

    if (!adapter) {
      // Fallback to JSON view
      const jsonAdapter = this.getAdapter("json")!;
      return {
        data: jsonAdapter.adapt(note),
        warning: `No adapter found for ${viewAs}. Showing raw JSON.`,
      };
    }

    if (!adapter.canAdapt(note)) {
      return {
        data: { code: JSON.stringify(note, null, 2), language: "json" },
        warning: `Cannot adapt ${(note as any).type} to ${viewAs}`,
      };
    }

    return {
      data: adapter.adapt(note),
      warning: adapter.getWarning?.(note) || null,
    };
  }
}

// Export singleton instance
export const viewAdapterRegistry = new AdapterRegistry();
