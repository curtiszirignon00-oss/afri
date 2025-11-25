import * as XLSX from 'xlsx';

// Inspecter plusieurs fichiers qui ont échoué
const files = [
  'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\bicb\\bicb.xlsx',
  'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\bnbc\\bnbc.xlsx',
  'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\BOAC\\BOAC.xlsx',
];

for (const excelPath of files) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`File: ${excelPath.split('\\').pop()}`);
  console.log('='.repeat(60));

  const workbook = XLSX.readFile(excelPath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Sheet name: ${firstSheetName}`);
  console.log(`Total rows: ${data.length}`);

  if (data.length > 0) {
    console.log('\nColumn names:');
    Object.keys(data[0]).forEach(key => console.log(`  - "${key}"`));

    console.log('\nFirst row sample:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}
