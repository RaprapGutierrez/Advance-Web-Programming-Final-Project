const pesoFmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
export const peso = (n: number) => pesoFmt.format(n);
export const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const shiftDate = (d: string, days: number) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() + days); return x.toLocaleDateString('en-CA'); };
export const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;
