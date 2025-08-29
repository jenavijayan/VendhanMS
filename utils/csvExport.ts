// utils/csvExport.ts

interface DataObject {
  [key: string]: any;
}

const convertToCSV = (data: DataObject[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '""'); // Escape double quotes
      return `"${escaped}"`; // Enclose in double quotes
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

export const exportToCSV = (data: DataObject[], filename: string): void => {
  const csvString = convertToCSV(data);
  if (!csvString) {
    console.error("No data to export or CSV string is empty.");
    return;
  }

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) { // Check if HTML5 download attribute is supported
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback for older browsers (less common now)
    console.warn("HTML5 download attribute not supported. CSV export might not work as expected.");
    // You could display the CSV string in a textarea for manual copy-paste as a fallback.
  }
};
