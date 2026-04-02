/**
 * textSplitter.js
 *
 * Splits long text into Discord-safe chunks (≤2000 chars each).
 * - Prefers splitting at paragraph boundaries (\n\n)
 * - Falls back to sentence boundaries (. ! ? followed by space/newline)
 * - Tracks open markdown formatting and closes/reopens across chunks
 *
 * Supported Discord markdown markers:
 *   ***  bold+italic
 *   **   bold
 *   *    italic
 *   __   underline
 *   _    italic (alt)
 *   ~~   strikethrough
 *   ||   spoiler
 */

const DISCORD_MAX = 2000;

// Ordered longest-first so we match ** before *, __ before _, etc.
const MARKERS = ['***', '**', '__', '~~', '||', '*', '_'];

/**
 * Scan text and determine which markdown markers are currently open at the end.
 * Returns an array of open marker strings in the order they were opened.
 */
function getOpenMarkers(text) {
  const openStack = [];
  let i = 0;

  while (i < text.length) {
    // Skip escaped characters
    if (text[i] === '\\' && i + 1 < text.length) {
      i += 2;
      continue;
    }

    // Skip inline code spans — formatting doesn't apply inside them
    if (text[i] === '`') {
      // Check for ``` code block
      if (text.slice(i, i + 3) === '```') {
        const endBlock = text.indexOf('```', i + 3);
        if (endBlock !== -1) {
          i = endBlock + 3;
          continue;
        }
      }
      // Single backtick inline code
      const endCode = text.indexOf('`', i + 1);
      if (endCode !== -1) {
        i = endCode + 1;
        continue;
      }
    }

    // Try to match a marker (longest first)
    let matched = false;
    for (const marker of MARKERS) {
      if (text.slice(i, i + marker.length) === marker) {
        // Check if this marker is already open (closing it)
        const openIdx = openStack.lastIndexOf(marker);
        if (openIdx !== -1) {
          // Close this marker and any that were opened after it
          openStack.splice(openIdx);
        } else {
          // Open this marker
          openStack.push(marker);
        }
        i += marker.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      i++;
    }
  }

  return openStack;
}

/**
 * Build closing string for open markers (reverse order) and
 * opening string for the next chunk (original order).
 */
function buildMarkerBridge(openMarkers) {
  if (openMarkers.length === 0) return { suffix: '', prefix: '' };
  // Close in reverse order
  const suffix = [...openMarkers].reverse().join('');
  // Reopen in original order
  const prefix = openMarkers.join('');
  return { suffix, prefix };
}

/**
 * Split text at the best boundary before maxLen.
 * Prefers paragraph breaks, then sentence endings, then word breaks.
 * Returns the index to split at (exclusive end of first chunk).
 */
function findSplitPoint(text, maxLen) {
  if (text.length <= maxLen) return text.length;

  const region = text.slice(0, maxLen);

  // 1. Try paragraph boundary (\n\n) — find the last one
  const paraBreak = region.lastIndexOf('\n\n');
  if (paraBreak > maxLen * 0.3) {
    return paraBreak;
  }

  // 2. Try sentence boundary (. ! ? followed by space or newline)
  let sentenceEnd = -1;
  for (let i = maxLen - 1; i > maxLen * 0.3; i--) {
    const ch = region[i];
    if ((ch === '.' || ch === '!' || ch === '?') &&
        i + 1 < region.length &&
        (region[i + 1] === ' ' || region[i + 1] === '\n')) {
      sentenceEnd = i + 1; // include the punctuation
      break;
    }
  }
  if (sentenceEnd > 0) return sentenceEnd;

  // 3. Try single newline
  const lineBreak = region.lastIndexOf('\n');
  if (lineBreak > maxLen * 0.3) return lineBreak;

  // 4. Try word boundary (space)
  const spaceBreak = region.lastIndexOf(' ');
  if (spaceBreak > maxLen * 0.3) return spaceBreak;

  // 5. Hard cut (last resort)
  return maxLen;
}

/**
 * Split a long text string into chunks safe for Discord (≤2000 chars each).
 * Preserves paragraph structure and markdown formatting across chunks.
 *
 * @param {string} text - The full text to split
 * @param {number} [maxLen=2000] - Maximum characters per chunk
 * @returns {string[]} Array of text chunks
 */
export function splitText(text, maxLen = DISCORD_MAX) {
  if (!text || text.length <= maxLen) return [text];

  const chunks = [];
  let remaining = text;
  let carryPrefix = ''; // markdown markers to reopen from previous chunk

  while (remaining.length > 0) {
    // Account for the prefix we need to prepend
    const effectiveMax = maxLen - carryPrefix.length;

    if (remaining.length <= effectiveMax) {
      // Everything fits
      chunks.push(carryPrefix + remaining);
      break;
    }

    // Find the best place to split
    const splitAt = findSplitPoint(remaining, effectiveMax);
    let chunk = remaining.slice(0, splitAt);
    remaining = remaining.slice(splitAt);

    // Trim leading whitespace/newlines from the remainder
    // (important: markdown like *text* won't render if there's a space after the opening marker)
    remaining = remaining.replace(/^[\s\n]+/, '');

    // Check what markdown is open at the end of this chunk
    // (including any prefix we prepended)
    const fullChunk = carryPrefix + chunk;
    const openMarkers = getOpenMarkers(fullChunk);
    const { suffix, prefix } = buildMarkerBridge(openMarkers);

    // Close open markers at end of this chunk
    chunks.push(fullChunk + suffix);

    // Carry the reopening markers to the next chunk
    carryPrefix = prefix;
  }

  // Filter out any empty chunks
  return chunks.filter((c) => c.trim().length > 0);
}
