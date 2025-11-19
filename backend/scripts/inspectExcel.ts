import * as XLSX from 'xlsx';

const excelPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\abjc\\abjc.xlsx';

// Read Excel file
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
console.log('Sheet names:', workbook.SheetNames);
console.log('Active sheet:', sheetName);

const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('\nTotal rows:', data.length);
console.log('\nFirst 5 rows:');
console.log(JSON.stringify(data.slice(0, 5), null, 2));

console.log('\nLast 5 rows:');
console.log(JSON.stringify(data.slice(-5), null, 2));

console.log('\nColumn names from first row:');
if (data.length > 0) {
  console.log(Object.keys(data[0]));
}
