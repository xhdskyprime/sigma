const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('database pegawai.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const pegawai = [];
let idCounter = 1;

for (let i = 1; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || !row[2]) continue;

  pegawai.push({
    id: idCounter++,
    nama: row[2].toString().trim(),
    profesi: row[1] ? row[1].toString().trim() : '-',
    jabatan: row[7] ? row[7].toString().trim() : '-'
  });
}

if (!fs.existsSync('src/data')) fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/pegawai.json', JSON.stringify(pegawai, null, 2));
console.log(`Saved ${pegawai.length} pegawai to src/data/pegawai.json`);
