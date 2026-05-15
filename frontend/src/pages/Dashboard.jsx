import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import { apiClient } from '../lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Trash2, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const r = await apiClient.get('/projects'); setProjects(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    try { const r = await apiClient.post('/projects', { name: 'New Project', description: '' }); nav(`/builder/${r.data.id}`); }
    finally { setCreating(false); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    await apiClient.delete(`/projects/${id}`);
    load();
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-neutral-900">Your projects</h1>
          <p className="text-[14px] text-neutral-500 mt-1">Build full-stack apps with AI — each chat creates real code.</p>
        </div>
        <button onClick={create} disabled={creating} className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-4 py-2.5 text-[14px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60">
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} New project
        </button>
      </div>

      {loading ? (
        <div className="text-neutral-500 text-[14px]">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
          <FolderKanban className="w-10 h-10 mx-auto text-neutral-400" />
          <p className="mt-3 text-[15px] text-neutral-700">No projects yet — create your first one.</p>
          <button onClick={create} className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-4 py-2 text-[13px] font-medium"><Plus className="w-4 h-4" /> New project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div key={p.id} className="group relative bg-white border border-neutral-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <Link to={`/builder/${p.id}`} className="block">
                <div className="text-[16px] font-semibold text-neutral-900 truncate">{p.name}</div>
                <div className="text-[13px] text-neutral-500 mt-1 line-clamp-2 min-h-[36px]">{p.description || 'No description yet.'}</div>
                <div className="mt-4 text-[12px] text-neutral-400">{p.files?.length || 0} files · {p.messages?.length || 0} msgs</div>
              </Link>
              <button onClick={() => remove(p.id)} className="absolute top-3 right-3 text-neutral-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
