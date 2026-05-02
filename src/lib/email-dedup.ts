// Email extraction + deduplication utilities.
// Dedup is EXACT match (case-sensitive). Order is preserved (first occurrence wins).
import * as XLSX from "xlsx";

export interface FileStats {
  name: string;
  count: number;
}

export interface DedupResult {
  unique: string[];
  total: number;
  duplicates: number;
  perFile: FileStats[];
}

// Extract non-empty trimmed lines from a string of text (for .txt / .csv).
function linesFromText(text: string): string[] {
  const out: string[] = [];
  // Split on any newline; .csv with one email per line works the same.
  for (const raw of text.split(/\r?\n/)) {
    const v = raw.trim();
    if (v) out.push(v);
  }
  return out;
}

// Extract email-looking strings from a single XLSX cell (handles cases where
// a row contains "name,email" or just an email).
function valuesFromXlsx(file: ArrayBuffer): string[] {
  const wb = XLSX.read(file, { type: "array" });
  const out: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
    for (const row of rows) {
      for (const cell of row) {
        if (cell == null) continue;
        const v = String(cell).trim();
        if (v) out.push(v);
      }
    }
  }
  return out;
}

export async function extractFromFile(file: File): Promise<string[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buf = await file.arrayBuffer();
    return valuesFromXlsx(buf);
  }
  // .txt and .csv: stream as text. Modern browsers handle large files fine.
  const text = await file.text();
  return linesFromText(text);
}

export async function dedupeFiles(files: File[]): Promise<DedupResult> {
  const seen = new Set<string>();
  const unique: string[] = [];
  const perFile: FileStats[] = [];
  let total = 0;

  for (const file of files) {
    const entries = await extractFromFile(file);
    perFile.push({ name: file.name, count: entries.length });
    total += entries.length;
    for (const e of entries) {
      if (!seen.has(e)) {
        seen.add(e);
        unique.push(e); // preserve original order of first occurrence
      }
    }
  }

  return { unique, total, duplicates: total - unique.length, perFile };
}
