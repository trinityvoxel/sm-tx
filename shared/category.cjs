// Primary title intent outranks incidental entertainment in a description.
function primaryCategory(title) {
  const text = String(title || '').toLowerCase();
  if (/\b(?:\d+(?:\.\d+)?\s*k|\d+\s*miler|marathon|half marathon|5k|10k|race|fun run|football|basketball|soccer|volleyball|baseball|softball)\b/.test(text)) return 'sports';
  if (/\b(?:flea market|farmers?['’]? market|makers? market|artisan market|market)\b/.test(text)) return 'markets';
  return null;
}
function fromText(text) {
  if (/\b(?:comedy|improv|theater|theatre|gallery|film|movie)\b|\bart show\b/.test(text)) return 'arts';
  if (/\b(?:festival|fest)\b/.test(text)) return 'festivals';
  if (/\b(?:music|band|concert|dj|karaoke)\b|\bopen mic\b/.test(text)) return 'music';
  if (/\b(?:food|drink|chef|culinary|wine|beer|brew)\b/.test(text)) return 'food';
  if (/\b(?:hike|hiking|trail|walk|outdoor|nature|birding)\b/.test(text)) return 'outdoor';
  if (/\b(?:trivia|bingo)\b|\bgame night\b/.test(text)) return 'community';
  if (/\b(?:nightlife|drag)\b|\bpool night\b/.test(text)) return 'nightlife';
  return null;
}
function guessCategory(title, details = '') {
  return primaryCategory(title) || fromText(String(title || '').toLowerCase()) ||
    primaryCategory(details) || fromText(String(details || '').toLowerCase()) || 'community';
}
module.exports = { primaryCategory, guessCategory };
