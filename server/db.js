const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'data/db.json');
const BACKUP_PATH = path.join(__dirname, 'data/db.backup.json');
const DEFAULT = { events: [] };

function load() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return JSON.parse(JSON.stringify(DEFAULT)); }
}

const db = { data: load() };

db.save = function() {
  const json = JSON.stringify(db.data, null, 2);
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, DB_PATH);
  fs.writeFileSync(BACKUP_PATH, json);
};

module.exports = db;
