// Permanent site policy: off-domain web destinations always open a new tab.
export function linkProps(href, rel = '') {
  try {
    const url = new URL(href, 'https://sm-tx.com');
    const external = /^https?:$/.test(url.protocol) && !['sm-tx.com','www.sm-tx.com'].includes(url.hostname);
    return external ? {target: '_blank', rel: [...new Set((rel+' noopener noreferrer').trim().split(/\s+/))].join(' ')} : {rel: rel || undefined};
  } catch { return {rel: rel || undefined}; }
}
