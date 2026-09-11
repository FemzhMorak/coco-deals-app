export function formatNaira(amount) {
  if (amount === null || amount === undefined) return '';
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

export function formatCompactTime(date) {
  const d = new Date(date);
  const diffMs = d.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const abs = Math.abs(diffMin);
  if (abs < 1) return 'just now';
  if (abs < 60) return diffMin > 0 ? `in ${abs}m` : `${abs}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return diffMin > 0 ? `in ${Math.abs(diffHr)}h` : `${Math.abs(diffHr)}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return diffMin > 0 ? `in ${Math.abs(diffDay)}d` : `${Math.abs(diffDay)}d ago`;
}

export function getCountdownParts(expiryDate) {
  const diff = new Date(expiryDate).getTime() - Date.now();
  if (diff <= 0) return { expired: true, text: 'Expired' };
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  let text;
  if (days > 0) text = `${days}d ${hours}h left`;
  else if (hours > 0) text = `${hours}h ${minutes}m left`;
  else text = `${minutes}m left`;
  return { expired: false, text, days, hours, minutes, totalMinutes };
}

export function isExpiringSoon(expiryDate, hours = 6) {
  const diff = new Date(expiryDate).getTime() - Date.now();
  return diff > 0 && diff <= hours * 3600 * 1000;
}
