/// <reference types="node" />
import * as XLSX from 'xlsx';

const excelPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\Boab\\BOAB.xlsx';

const workbook = XLSX.readFile(excelPath);
console.log('Sheet names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('\nTotal rows:', data.length);
console.log('\nColumn names:', Object.keys((data[0] as any) || {}));
console.log('\nFirst 3 rows:');
console.log(JSON.stringify(data.slice(0, 3), null, 2));
console.log('\nLast 3 rows:');
console.log(JSON.stringify(data.slice(-3), null, 2));
