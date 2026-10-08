import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { api, errMsg } from '../lib/api';
import { Async, ConfirmDialog, Empty, PageHeader } from '../components/ui';
import { RenterModal } from '../components/forms';
import { useToast } from '../components/Toast';
import { peso } from '../lib/format';
import type { Renter } from '../types';

const tierCls = { Standard: 'bg-brand-50 text-brand-700', Silver: 'bg-ink-300/40 text-ink-900', Gold: 'bg-spot-300 text-ink-900' };

export default function Renters() {
  const { data, loading, error, refetch } = useFetch<Renter[]>('/renters');
  const [modal, setModal] = useState<Renter | 'new' | null>(null);
  const [del, setDel] = useState<Renter | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function remove() {
    if (!del) return;
    setBusy(true);
    try { await api.delete(`/renters/${del.id}`); toast(`Deleted ${del.name}`); setDel(null); refetch(); }
    catch (e) { toast(errMsg(e), 'error'); setDel(null); } finally { setBusy(false); }
  }
  return (
    <>
      <PageHeader title="Renters" subtitle="Loyalty tiers update as bookings are completed." actions={<button className="btn btn-spot" onClick={() => setModal('new')}>Add renter</button>} />
      <Async loading={loading} error={error} retry={refetch}>
        {data?.length === 0 && <Empty title="No renters yet" hint="Add the people and groups who rent your rooms." action={<button className="btn btn-primary" onClick={() => setModal('new')}>Add renter</button>} />}
        {data && data.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.map((r) => (
              <article key={r.id} className="card flex flex-col">
                <div className="flex items-start justify-between gap-3"><h2 className="break-words text-lg font-bold">{r.name}</h2><span className={`badge ${tierCls[r.tier]}`}>{r.tier}{r.discountRate > 0 && ` · ${Math.round(r.discountRate * 100)}% off`}</span></div>
                <p className="mt-1 truncate text-sm text-ink-500">{r.email}</p><p className="text-sm text-ink-500">{r.phone}</p>
                <p className="mt-3 text-sm">{r.completedBookings} completed · {r.bookings} total bookings</p>
                <p className={`font-display text-xl font-bold ${r.balanceDue > 0 ? 'text-alert-600' : 'text-ok-600'}`}>{r.balanceDue > 0 ? `${peso(r.balanceDue)} due` : 'Nothing due'}</p>
                <div className="mt-4 flex gap-2"><button className="btn btn-ghost" onClick={() => setModal(r)}>Edit</button><button className="btn btn-ghost text-alert-600" onClick={() => setDel(r)}>Delete</button></div>
              </article>
            ))}
          </div>
        )}
      </Async>
      {modal && <RenterModal renter={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} onSaved={refetch} />}
      <ConfirmDialog open={!!del} busy={busy} title={`Delete ${del?.name}?`} message="Renters with bookings can't be deleted." onConfirm={remove} onCancel={() => setDel(null)} />
    </>
  );
}
