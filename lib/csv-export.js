'use client';

// Échappe une valeur pour un champ CSV (RFC 4180) : entoure de guillemets si elle contient
// une virgule, un guillemet ou un retour à la ligne, double les guillemets internes.
function escapeCsvValue(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// columns: [{ key, label }] — déclenche le téléchargement d'un CSV (BOM UTF-8 pour Excel).
export function exportToCSV(filename, rows, columns) {
  const header = columns.map(c => escapeCsvValue(c.label)).join(',');
  const lines = rows.map(row => columns.map(c => escapeCsvValue(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','));
  const csv = [header, ...lines].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
