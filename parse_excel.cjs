const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('JADWAL KEGIATAN HARIAN RSUD TIGARAKSA.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// Find headers
let startRow = 0;
for(let i=0; i<rawData.length; i++) {
  if (rawData[i] && rawData[i].length > 2 && typeof rawData[i][3] === 'string' && rawData[i][3].toLowerCase().includes('acara')) {
    startRow = i + 1;
    break;
  }
}

// Map data
const agendas = [];
let idCounter = 1;

for (let i = startRow; i < rawData.length; i++) {
  const row = rawData[i];
  if (!row || row.length === 0 || !row[1] || !row[3] || row[1] === 'TANGGAL' || row[3] === 'KEGIATAN') continue;

  // parse excel date (days since 1900-01-01)
  // formula: (excelDate - 25569) * 86400 * 1000
  let dateStr = "";
  if (typeof row[1] === 'number') {
    const d = new Date((row[1] - 25569) * 86400 * 1000);
    dateStr = d.toISOString().split('T')[0];
  } else {
    dateStr = row[1]; // fallback if it's already string
  }

  // parse time
  const timeStr = String(row[2] || "08:00");
  const timeStartMatch = timeStr.match(/\d{1,2}:\d{2}/);
  let timeStart = timeStartMatch ? timeStartMatch[0] : "08:00";
  if (timeStart.length === 4) {
    timeStart = "0" + timeStart;
  }
  const timeEnd = timeStr.toLowerCase().includes("selesai") ? "12:00" : timeStart; // mock end time

  let attendees = row[5] ? row[5].replace(/"/g, '').trim() : "";
  let location = row[4] || "RSUD Tigaraksa";
  let title = row[3] || "Agenda Kosong";
  
  let category = 'Pelayanan';
  if (title.toLowerCase().includes('akreditasi') || title.toLowerCase().includes('kars')) category = 'Akreditasi';
  else if (title.toLowerCase().includes('rapat') || title.toLowerCase().includes('direktur')) category = 'Direksi';
  else if (title.toLowerCase().includes('diklat') || title.toLowerCase().includes('workshop') || title.toLowerCase().includes('ujian')) category = 'Diklat';
  
  let color = 'var(--color-status-yellow)';
  if (category === 'Akreditasi') color = 'var(--color-status-purple)';
  if (category === 'Direksi') color = 'var(--color-status-blue)';
  if (category === 'Diklat') color = 'var(--color-status-orange)';

  let catColor = color.replace('status', 'cat');

  agendas.push({
    id: idCounter++,
    title: title,
    date: dateStr,
    timeStart: timeStart,
    timeEnd: timeEnd,
    location: location,
    pic: attendees.split(',')[0] || '-',
    unit: category,
    attendees: attendees,
    category: category,
    status: 'Akan Dimulai',
    color: color,
    catColor: catColor,
    admin: {
      suratTugas: 'Belum Dibuat',
      undangan: row[7] ? 'Sudah Selesai' : 'Belum Dibuat',
      notaDinas: 'Belum Dibuat',
      status: row[7] ? 'Belum Lengkap' : 'Kosong',
      statusColor: row[7] ? 'var(--color-status-yellow)' : 'var(--color-status-red)'
    },
    adminFiles: {
      suratTugas: null,
      undangan: row[7] || null,
      notaDinas: null
    }
  });
}

// Print max 10 to check
console.log(JSON.stringify(agendas.slice(0, 2), null, 2));

// Save to a file so we can inject it easily
if (!fs.existsSync('src/data')) fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/agendas.json', JSON.stringify(agendas, null, 2));
console.log(`Saved ${agendas.length} agendas to src/data/agendas.json`);
