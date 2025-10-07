/**
 * Guitar chord transposition utilities
 */

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const NOTE_TO_INDEX: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11
};

/**
 * Transpose a single chord by semitones
 */
export function transposeChord(chord: string, semitones: number): string {
  // Handle empty or invalid chords
  if (!chord || chord.trim() === '') return chord;
  
  // Match the root note (including # or b)
  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chord;
  
  const [, root, suffix] = match;
  
  // Get the note index
  const rootIndex = NOTE_TO_INDEX[root];
  if (rootIndex === undefined) return chord;
  
  // Transpose
  let newIndex = (rootIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  // Prefer sharps for sharp keys, flats for flat keys
  const useFlats = root.includes('b');
  const newRoot = useFlats ? FLAT_NOTES[newIndex] : NOTES[newIndex];
  
  return newRoot + suffix;
}

/**
 * Transpose all chords in a chord sheet (supports both bracket and plain text formats)
 */
export function transposeChordSheet(content: string, semitones: number): string {
  if (semitones === 0) return content;
  
  // Detect format and use appropriate transposition
  if (isPlainTextFormat(content)) {
    return transposePlainText(content, semitones);
  }
  
  // Replace chords in brackets [chord]
  return content.replace(/\[([A-G][#b]?[^\]]*)\]/g, (match, chord) => {
    const transposed = transposeChord(chord, semitones);
    return `[${transposed}]`;
  });
}

/**
 * Detect the key of a chord sheet based on the first chord
 */
export function detectKey(content: string): string | null {
  const match = content.match(/\[([A-G][#b]?)/);
  return match ? match[1] : null;
}

/**
 * Parse a chord sheet and extract chords (supports both [C] and plain text formats)
 */
export function extractChords(content: string): string[] {
  const chords: string[] = [];
  
  // Extract from bracket format [C]
  const bracketMatches = content.matchAll(/\[([A-G][#b]?[^\]]*)\]/g);
  chords.push(...Array.from(bracketMatches, m => m[1]));
  
  // Extract from plain text tab format (chord lines)
  const lines = content.split('\n');
  for (const line of lines) {
    // Skip lines that start with # (lyrics/comments)
    if (line.trim().startsWith('#')) continue;
    
    // Look for chord patterns like | E  D  | A |
    const chordMatches = line.matchAll(/([A-G][#b]?(?:maj|min|m|sus|add|dim|aug|\d)*)/g);
    for (const match of chordMatches) {
      const chord = match[1];
      // Only add if it looks like a standalone chord (not part of a word)
      if (NOTE_TO_INDEX[chord[0]] !== undefined) {
        chords.push(chord);
      }
    }
  }
  
  return [...new Set(chords)]; // Remove duplicates
}

/**
 * Detect if content is in plain text tab format vs bracket format
 */
export function isPlainTextFormat(content: string): boolean {
  const hasBrackets = /\[[A-G][#b]?[^\]]*\]/.test(content);
  const hasChordLines = /\|[^|]*[A-G][#b]?[^|]*\|/.test(content);
  
  // If it has chord lines with pipes, it's likely tab format
  // Even if it has some brackets
  return hasChordLines || (!hasBrackets && /^[A-G][#b]?/.test(content.trim()));
}

/**
 * Convert plain text tab format to bracket format
 * e.g., "| E  D | A |" with "# lyrics" → "[E] lyrics [D] [A]"
 */
export function plainTextToBracket(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // If line starts with #, it's a lyric line
    if (line.trim().startsWith('#')) {
      result.push(line.replace(/^#\s*/, ''));
      continue;
    }
    
    // If line has pipes, it's a chord line
    if (line.includes('|')) {
      // Extract chords from the chord line
      const chords: string[] = [];
      const chordMatches = line.matchAll(/([A-G][#b]?(?:maj|min|m|sus|add|dim|aug|\d)*)/g);
      
      for (const match of chordMatches) {
        chords.push(match[1]);
      }
      
      // If there's a lyric line following, interleave chords
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.trim().startsWith('#')) {
        // Skip, we'll process it with the lyric line
        continue;
      } else {
        // Just output the chords
        result.push(chords.map(c => `[${c}]`).join(' '));
      }
    } else {
      // Plain text line
      result.push(line);
    }
  }
  
  return result.join('\n');
}

/**
 * Convert bracket format to plain text tab format
 * e.g., "[C]Amazing [Am]grace" → "| C  Am |\n# Amazing grace"
 */
export function bracketToPlainText(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  
  for (const line of lines) {
    // Extract chords and lyrics
    const parts: Array<{type: 'chord' | 'text', content: string}> = [];
    let lastIndex = 0;
    
    const chordMatches = line.matchAll(/\[([A-G][#b]?[^\]]*)\]/g);
    const matches = Array.from(chordMatches);
    
    if (matches.length === 0) {
      // No chords, just text
      result.push(line);
      continue;
    }
    
    // Build chord line and lyric line
    const chords: string[] = [];
    let lyrics = '';
    
    for (const match of matches) {
      const chord = match[1];
      const index = match.index!;
      
      // Add text before the chord
      if (index > lastIndex) {
        lyrics += line.substring(lastIndex, index);
      }
      
      chords.push(chord);
      lastIndex = index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < line.length) {
      lyrics += line.substring(lastIndex);
    }
    
    // Output chord line
    result.push(`| ${chords.join('  ')} |`);
    
    // Output lyric line if there are lyrics
    if (lyrics.trim()) {
      result.push(`# ${lyrics.trim()}`);
    }
  }
  
  return result.join('\n');
}

/**
 * Transpose plain text tab format
 */
export function transposePlainText(content: string, semitones: number): string {
  if (semitones === 0) return content;
  
  const lines = content.split('\n');
  const result: string[] = [];
  
  for (const line of lines) {
    // Skip lyric lines (start with #)
    if (line.trim().startsWith('#')) {
      result.push(line);
      continue;
    }
    
    // Transpose chords in the line
    const transposed = line.replace(/([A-G][#b]?(?:maj|min|m|sus|add|dim|aug|\d)*)/g, (match) => {
      // Only transpose if it's a valid chord
      if (NOTE_TO_INDEX[match[0]] !== undefined) {
        return transposeChord(match, semitones);
      }
      return match;
    });
    
    result.push(transposed);
  }
  
  return result.join('\n');
}
