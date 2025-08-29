// utils/csvParser.ts

export interface CSVParseResult {
  headers: string[];
  data: Record<string, string>[];
  skippedRows?: {rowNumber: number, reason: string, rowContent: string}[];
}

export interface CSVParseError {
  error: string;
}

export const parseCSVToObjects = (csvString: string): CSVParseResult | CSVParseError => {
  if (!csvString || csvString.trim() === '') {
    return { error: "CSV string is empty." };
  }

  const rows = csvString.trim().split(/\r?\n/); // Handles both \n and \r\n line endings

  if (rows.length === 0) {
    return { error: "CSV has no rows." };
  }

  // Use the first row as headers, trim and remove potential surrounding quotes
  const headers = rows[0].split(',').map(header => header.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));


  if (headers.length === 0 || headers.every(h => h === '')) {
    return { error: "CSV headers are missing or empty."};
  }
  
  const data: Record<string, string>[] = [];
  const skippedRows: {rowNumber: number, reason: string, rowContent: string}[] = [];


  for (let i = 1; i < rows.length; i++) {
    const rowString = rows[i];
    if (rowString.trim() === '') continue; // Skip empty lines

    const values: string[] = [];
    let currentVal = '';
    let inQuotes = false;

    for (let charIndex = 0; charIndex < rowString.length; charIndex++) {
        const char = rowString[charIndex];
        if (char === '"') {
            // If current char is a quote and next char is also a quote (escaped quote)
            if (inQuotes && charIndex + 1 < rowString.length && rowString[charIndex + 1] === '"') {
                currentVal += '"';
                charIndex++; // Skip the next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(currentVal.trim());
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    values.push(currentVal.trim()); // Add the last value

    if (values.length !== headers.length) {
       skippedRows.push({
          rowNumber: i + 1, // 1-based index for user display
          reason: `Inconsistent column count. Expected ${headers.length}, got ${values.length}.`,
          rowContent: rowString
      });
      continue; 
    }

    const rowObject: Record<string, string> = {};
    headers.forEach((header, index) => {
      // Values are already trimmed during parsing, no need to re-trim or unquote here.
      rowObject[header] = values[index];
    });
    data.push(rowObject);
  }

  return { headers, data, skippedRows };
};