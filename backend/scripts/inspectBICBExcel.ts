/// <reference types="node" />
import * as XLSX from 'xlsx';

const excelPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\bicb\\bicb.xlsx';

const workbook = XLSX.readFile(excelPath);
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
const data: any[] = XLSX.utils.sheet_to_json(worksheet);

console.log('First sheet name:', firstSheetName);
console.log('Total rows:', data.length);
console.log('\nFirst 3 rows:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));

console.log('\nColumn names:');
if (data.length > 0) {
  console.log(Object.keys(data[0]));
}
