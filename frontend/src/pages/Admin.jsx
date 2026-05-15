import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import { apiClient } from '../lib/auth';
import { Plus, Save, Trash2, Coins, Loader2, Settings as SettingsIcon, Package as PackageIcon, Users as UsersIcon } from 'lucide-react';

export default function Admin() {
  const [tab, setTab] = useState('settings');
  return (
    <AppShell>
      <h1 className="text-[28px] font-semibold tracking-tight text-neutral-900 mb-1">Admin panel</h1>
      <p className="text-[13px] text-neutral-500 mb-6">Configure Stripe, packages, users and credits.</p>
      <div className="flex items-center gap-2 mb-6">
        <TabBtn active={tab==='settings'} onClick={() => setTab('settings')} icon={SettingsIcon}>Settings</TabBtn>
        <TabBtn active={tab==='packages'} onClick={() => setTab('packages')} icon={PackageIcon}>Packages</TabBtn>
        <TabBtn active={tab==='users'} onClick={() => setTab('users')} icon={UsersIcon}>Users</TabBtn>
      </div>
      {tab === 'settings' && <SettingsTab />}
      {tab === 'packages' && <PackagesTab />}
      {tab === 'users' && <UsersTab />}
    </AppShell>
  );
}
function TabBtn({ active, onClick, icon: Icon, children }) {
  return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${active ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'}`}><Icon className="w-4 h-4" /> {children}</button>;
}

function SettingsTab() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { apiClient.get('/admin/settings').then((r) => setS(r.data)); }, []);
  const save = async () => {
    setSaving(true); setMsg('');
    try { const r = await apiClient.put('/admin/settings', s); setS(r.data); setMsg('Saved.'); }
    catch (e) { setMsg(e?.response?.data?.detail || 'Error'); }
    finally { setSaving(false); }
  };
  if (!s) return <div className="text-neutral-500">Loading…</div>;
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 max-w-2xl space-y-4">
      <Field label="Site name"><input value={s.site_name} onChange={(e) => setS({ ...s, site_name: e.target.value })} className="input" /></Field>
      <Field label="Free signup credits"><input type="number" value={s.free_signup_credits} onChange={(e) => setS({ ...s, free_signup_credits: +e.target.value })} className="input" /></Field>
      <Field label="Stripe mode">
        <select value={s.stripe_mode} onChange={(e) => setS({ ...s, stripe_mode: e.target.value })} className="input">
          <option value="test">test</option><option value="live">live</option>
        </select>
      </Field>
      <Field label="Stripe Secret API key (sk_...)"><input value={s.stripe_api_key} onChange={(e) => setS({ ...s, stripe_api_key: e.target.value })} placeholder="sk_test_… or sk_live_…" className="input" /></Field>
      <Field label="Stripe Publishable key (pk_...)"><input value={s.stripe_publishable_key} onChange={(e) => setS({ ...s, stripe_publishable_key: e.target.value })} placeholder="pk_test_… or pk_live_…" className="input" /></Field>
      <div className="flex items-center justify-between">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-4 py-2 text-[14px] disabled:opacity-60">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save</button>
        {msg && <span className="text-[13px] text-neutral-600">{msg}</span>}
      </div>
      <style>{`.input{ width:100%; border:1px solid #e5e5e5; border-radius:10px; padding:10px 14px; font-size:14px; outline:none; background:white } .input:focus{ border-color:#111 }`}</style>
    </div>
  );
}
function Field({ label, children }) { return <label className="block"><div className="text-[12px] uppercase tracking-wider text-neutral-500 mb-1">{label}</div>{children}</label>; }

function PackagesTab() {
  const [items, setItems] = useState([]);
  const blank = { name: '', description: '', credits: 10, price_usd: 5, active: true, sort_order: 0 };
  const [draft, setDraft] = useState(blank);
  const load = () => apiClient.get('/admin/packages').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);
  const save = async () => { await apiClient.post('/admin/packages', draft); setDraft(blank); load(); };
  const update = async (id, body) => { await apiClient.put(`/admin/packages/${id}`, body); load(); };
  const remove = async (id) => { if (!window.confirm('Delete?')) return; await apiClient.delete(`/admin/packages/${id}`); load(); };
  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-2xl p-5">
        <div className="font-medium mb-3">Add package</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" />
          <input placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="input md:col-span-2" />
          <input type="number" placeholder="Credits" value={draft.credits} onChange={(e) => setDraft({ ...draft, credits: +e.target.value })} className="input" />
          <input type="number" step="0.01" placeholder="Price USD" value={draft.price_usd} onChange={(e) => setDraft({ ...draft, price_usd: +e.target.value })} className="input" />
        </div>
        <div className="mt-3 flex justify-end"><button onClick={save} className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-4 py-2 text-[13px]"><Plus className="w-4 h-4" /> Add</button></div>
        <style>{`.input{ border:1px solid #e5e5e5; border-radius:10px; padding:9px 12px; font-size:13.5px; outline:none; background:white }`}</style>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
        <table className="w-full text-[13.5px]">
          <thead className="bg-neutral-50 text-neutral-500 text-left"><tr><th className="p-3">Name</th><th className="p-3">Description</th><th className="p-3">Credits</th><th className="p-3">Price</th><th className="p-3">Active</th><th className="p-3"></th></tr></thead>
          <tbody>
            {items.map((p) => <PackageRow key={p.id} p={p} onUpdate={update} onDelete={remove} />)}
            {items.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-neutral-500">No packages yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function PackageRow({ p, onUpdate, onDelete }) {
  const [d, setD] = useState(p);
  const dirty = JSON.stringify(d) !== JSON.stringify(p);
  return (
    <tr className="border-t border-neutral-200">
      <td className="p-2"><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className="w-full px-2 py-1.5 rounded border border-transparent hover:border-neutral-200" /></td>
      <td className="p-2"><input value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} className="w-full px-2 py-1.5 rounded border border-transparent hover:border-neutral-200" /></td>
      <td className="p-2"><input type="number" value={d.credits} onChange={(e) => setD({ ...d, credits: +e.target.value })} className="w-24 px-2 py-1.5 rounded border border-transparent hover:border-neutral-200" /></td>
      <td className="p-2"><input type="number" step="0.01" value={d.price_usd} onChange={(e) => setD({ ...d, price_usd: +e.target.value })} className="w-24 px-2 py-1.5 rounded border border-transparent hover:border-neutral-200" /></td>
      <td className="p-2"><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} /></td>
      <td className="p-2 text-right whitespace-nowrap">
        {dirty && <button onClick={() => onUpdate(p.id, { name: d.name, description: d.description, credits: d.credits, price_usd: d.price_usd, active: d.active, sort_order: d.sort_order || 0 })} className="mr-2 inline-flex items-center gap-1 text-blue-600"><Save className="w-3.5 h-3.5" /> Save</button>}
        <button onClick={() => onDelete(p.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
      </td>
    </tr>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const load = () => apiClient.get('/admin/users').then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);
  const adjust = async (u, delta) => {
    const reason = window.prompt(`Reason for adjusting ${u.email} by ${delta}?`, '');
    if (reason === null) return;
    await apiClient.post('/admin/credits/adjust', { user_id: u.id, delta, reason });
    load();
  };
  const setRole = async (u, role) => { await apiClient.put(`/admin/users/${u.id}`, { role }); load(); };
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <table className="w-full text-[13.5px]">
        <thead className="bg-neutral-50 text-neutral-500 text-left"><tr><th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Credits</th><th className="p-3">Created</th><th className="p-3 text-right">Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-neutral-200">
              <td className="p-3 font-medium">{u.name}</td>
              <td className="p-3 text-neutral-600">{u.email}</td>
              <td className="p-3"><select value={u.role} onChange={(e) => setRole(u, e.target.value)} className="px-2 py-1 rounded border border-neutral-200 bg-white"><option value="user">user</option><option value="admin">admin</option></select></td>
              <td className="p-3 inline-flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-amber-500" /> {u.credits}</td>
              <td className="p-3 text-neutral-500">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="p-3 text-right whitespace-nowrap">
                <button onClick={() => adjust(u, 50)} className="mr-2 text-blue-600">+50</button>
                <button onClick={() => adjust(u, 200)} className="mr-2 text-blue-600">+200</button>
                <button onClick={() => { const n = +window.prompt('Add credits amount (negative to subtract):','100'); if (n) adjust(u, n); }} className="text-blue-600">custom</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
