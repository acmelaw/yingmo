/**
 * Universal chord sheet format support
 * Formats: ChordPro, Tab (early 2000s style), Inline brackets
 */

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Format detection
export type ChordFormat = 'chordpro' | 'tab' | 'inline';

export function detectFormat(content: string): ChordFormat {
  if (/\{(title|artist|key|tempo|capo):/i.test(content)) return 'chordpro';
  if (/\|[^|]*[A-G][#b]?[^|]*\|/.test(content) || /^#\s+.+/m.test(content)) return 'tab';
  return 'inline';
}

// Metadata extraction (ChordPro directives)
export function extractMetadata(content: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^\{([^:]+):\s*([^}]+)\}/);
    if (match) {
      meta[match[1].toLowerCase()] = match[2].trim();
    }
  }
  
  return meta;
}

// Chord transposition
export function transposeChord(chord: string, semitones: number): string {
  const match = chord.match(/^([A-G][#b]?)(.*)/);
  if (!match) return chord;
  
  const [, root, suffix] = match;
  const noteMap: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
  };
  
  const index = noteMap[root];
  if (index === undefined) return chord;
  
  const newIndex = (index + semitones + 12) % 12;
  return NOTES[newIndex] + suffix;
}

// Extract all chords from any format
export function extractChords(content: string): string[] {
  const format = detectFormat(content);
  const chords = new Set<string>();
  
  if (format === 'chordpro') {
    // ChordPro: [C]lyrics or standalone [C]
    const matches = content.matchAll(/\[([A-G][#b]?[^\]]*)\]/g);
    for (const match of matches) {
      chords.add(match[1].split('/')[0].trim());
    }
  } else if (format === 'tab') {
    // Tab: | C D Em | format
    const matches = content.matchAll(/\|([^|]+)\|/g);
    for (const match of matches) {
      const line = match[1];
      const chordMatches = line.matchAll(/([A-G][#b]?(?:m|maj|dim|aug|sus|add|[0-9])*)/g);
      for (const chord of chordMatches) {
        chords.add(chord[1]);
      }
    }
  } else {
    // Inline: [C]lyrics
    const matches = content.matchAll(/\[([A-G][#b]?[^\]]*)\]/g);
    for (const match of matches) {
      chords.add(match[1].split('/')[0].trim());
    }
  }
  
  return Array.from(chords).filter(c => c.length > 0);
}

// Transpose entire sheet
export function transposeSheet(content: string, semitones: number): string {
  if (semitones === 0) return content;
  
  const format = detectFormat(content);
  
  if (format === 'chordpro' || format === 'inline') {
    // Transpose [C] style chords
    return content.replace(/\[([A-G][#b]?[^\]]*)\]/g, (_match, chord: string) => {
      const parts = chord.split('/');
      const transposed = parts.map((c: string) => transposeChord(c.trim(), semitones)).join('/');
      return `[${transposed}]`;
    });
  } else {
    // Tab format: transpose chords in | C D | lines
    const lines = content.split('\n');
    return lines.map(line => {
      if (line.includes('|')) {
        return line.replace(/([A-G][#b]?(?:m|maj|dim|aug|sus|add|[0-9])*)/g, 
          chord => transposeChord(chord, semitones));
      }
      return line;
    }).join('\n');
  }
}

// Format conversion
export function convertFormat(content: string, targetFormat: ChordFormat): string {
  const currentFormat = detectFormat(content);
  if (currentFormat === targetFormat) return content;
  
  // Extract metadata first
  const meta = extractMetadata(content);
  
  if (targetFormat === 'chordpro') {
    // Convert to ChordPro
    const metaLines = Object.entries(meta).map(([k, v]) => `{${k}: ${v}}`);
    const contentLines = content.split('\n').filter(l => !l.match(/^\{[^}]+\}/));
    
    if (currentFormat === 'tab') {
      // Tab → ChordPro: convert | C D | + # lyrics to [C][D]lyrics
      const converted = contentLines.map(line => {
        if (line.includes('|')) {
          const chords = line.match(/([A-G][#b]?[^\s|]+)/g) || [];
          return chords.map(c => `[${c}]`).join('');
        }
        return line.replace(/^#\s*/, '');
      }).join('\n');
      return [...metaLines, converted].join('\n');
    } else {
      // Inline → ChordPro: already compatible
      return [...metaLines, ...contentLines].join('\n');
    }
  } else if (targetFormat === 'tab') {
    // Convert to Tab format
    const lines = content.split('\n').filter(l => !l.match(/^\{[^}]+\}/));
    const result: string[] = [];
    
    for (const line of lines) {
      if (/\[([A-G][#b]?[^\]]*)\]/.test(line)) {
        // Extract chords and lyrics separately
        const chords: string[] = [];
        const lyrics = line.replace(/\[([A-G][#b]?[^\]]*)\]/g, (_, chord) => {
          chords.push(chord);
          return '';
        }).trim();
        
        if (chords.length > 0) {
          result.push(`| ${chords.join(' ')} |`);
        }
        if (lyrics) {
          result.push(`# ${lyrics}`);
        }
      } else if (line.trim()) {
        result.push(`# ${line}`);
      }
    }
    
    return result.join('\n');
  }
  
  // Target is inline - convert from tab or chordpro
  if (currentFormat === 'tab') {
    const lines = content.split('\n');
    const result: string[] = [];
    let currentChords: string[] = [];
    
    for (const line of lines) {
      if (line.includes('|')) {
        currentChords = (line.match(/([A-G][#b]?[^\s|]+)/g) || []);
      } else if (line.startsWith('#')) {
        const lyrics = line.replace(/^#\s*/, '');
        if (currentChords.length > 0) {
          const words = lyrics.split(/\s+/);
          let output = '';
          currentChords.forEach((chord, i) => {
            output += `[${chord}]${words[i] || ''} `;
          });
          result.push(output.trim());
          currentChords = [];
        } else {
          result.push(lyrics);
        }
      }
    }
    
    return result.join('\n');
  } else if (currentFormat === 'chordpro') {
    // ChordPro → inline: strip metadata directives
    return content.split('\n')
      .filter(l => !l.match(/^\{[^}]+\}/))
      .join('\n');
  }
  
  return content;
}
