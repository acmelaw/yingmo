/**
 * Universal Slash Command Parser with K-V Parameters
 *
 * Supports formats like:
 * - /chords {title:Song} {artist:Artist} lyrics here
 * - /chord-sheet/transpose=2/key=G/capo=3 content
 * - /code/lang=python print("hello")
 * - /text/color=red/tags=work,urgent meeting notes
 */

export interface ParsedSlashCommand {
  command: string;
  type: string | null;
  parameters: Record<string, any>;
  content: string;
  rawCommand: string;
}

/**
 * Parse slash command with k-v parameters
 * Supports both /command/k=v/k=v and {k:v} syntax
 */
export function parseSlashCommand(text: string): ParsedSlashCommand | null {
  const trimmed = text.trim();

  // Check if starts with slash
  if (!trimmed.startsWith("/")) {
    return null;
  }

  // Extract command and parameters
  let command = "";
  const parameters: Record<string, any> = {};
  let content = "";
  let rawCommand = "";

  // Try /command/k=v/k=v format first
  const slashMatch = trimmed.match(/^(\/[^/\s]+(?:\/[^/\s]+=[^/\s]+)*)\s*(.*)/);

  if (slashMatch) {
    rawCommand = slashMatch[1];
    content = slashMatch[2] || "";

    const parts = rawCommand.split("/").filter((p) => p);
    command = parts[0].toLowerCase();

    // Parse k=v pairs
    for (let i = 1; i < parts.length; i++) {
      const kvMatch = parts[i].match(/^([^=]+)=(.+)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim();
        const value = parseValue(kvMatch[2].trim());
        parameters[key] = value;
      }
    }
  } else {
    // Fallback to simple /command format
    const simpleMatch = trimmed.match(/^(\/\S+)\s*(.*)/);
    if (simpleMatch) {
      rawCommand = simpleMatch[1];
      command = simpleMatch[1].slice(1).toLowerCase();
      content = simpleMatch[2] || "";
    }
  }

  // Also check for {k:v} syntax in content (ChordPro style)
  const directiveMatches = content.matchAll(/\{([^:}]+):([^}]+)\}/g);
  for (const match of directiveMatches) {
    const key = match[1].trim();
    const value = parseValue(match[2].trim());
    parameters[key] = value;
  }

  if (!command) {
    return null;
  }

  return {
    command,
    type: null, // Will be resolved by module registry
    parameters,
    content: content.trim(),
    rawCommand,
  };
}

/**
 * Parse parameter value with type inference
 */
function parseValue(value: string): any {
  // Boolean
  if (value === "true") return true;
  if (value === "false") return false;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }

  // Array (comma-separated)
  if (value.includes(",")) {
    return value.split(",").map((v) => v.trim());
  }

  // String
  return value;
}

/**
 * Build slash command string from parameters
 */
export function buildSlashCommand(
  command: string,
  parameters: Record<string, any> = {},
  content: string = ""
): string {
  let result = `/${command}`;

  // Add k=v parameters
  const kvParams = Object.entries(parameters)
    .filter(([_, v]) => v !== null && v !== undefined)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return `${k}=${v.join(",")}`;
      }
      return `${k}=${v}`;
    });

  if (kvParams.length > 0) {
    result += "/" + kvParams.join("/");
  }

  if (content) {
    result += " " + content;
  }

  return result;
}

/**
 * Extract parameters from ChordPro-style directives
 */
export function extractChordProDirectives(
  content: string
): Record<string, any> {
  const params: Record<string, any> = {};
  const matches = content.matchAll(/\{([^:}]+):([^}]+)\}/g);

  for (const match of matches) {
    const key = match[1].trim();
    const value = parseValue(match[2].trim());
    params[key] = value;
  }

  return params;
}

/**
 * Strip ChordPro directives from content
 */
export function stripChordProDirectives(content: string): string {
  return content.replace(/\{[^:}]+:[^}]+\}/g, "").trim();
}
