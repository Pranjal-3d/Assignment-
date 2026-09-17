export function priorityClass(p: string) {
  const map: Record<string, string> = { Critical: 'pCritical', High: 'pHigh', Medium: 'pMedium', Low: 'pLow' };
  return map[p] ?? 'pLow';
}

export function statusLabel(s: string) {
  const l = s.toLowerCase();
  if (l.includes('resolved') || l.includes('approved') || l.includes('closed')) return 'sbGreen';
  if (l.includes('rejected')) return 'sbRed';
  if (l.includes('escalated') || l.includes('security'))  return 'sbRed';
  if (l.includes('pending') || l.includes('waiting'))     return 'sbOrange';
  if (l.includes('progress') || l.includes('investigat')) return 'sbBlue';
  return 'sbGray';
}

export function formatTime(date = new Date()) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
