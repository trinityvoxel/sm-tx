// A verified season end is not a rule for manufacturing next year's dates.
const seasons = {
  'summer-in-the-park': { through: '2026-08-06', year: 2026 },
};
function sourceSeason(id, today) {
  const season = seasons[id];
  if (!season || today <= season.through) return null;
  return { status: 'out_of_season', season_end: season.through,
    reason: `${season.year} season ended. Await a verified new-season schedule before reactivating collection.` };
}
module.exports = { sourceSeason };
