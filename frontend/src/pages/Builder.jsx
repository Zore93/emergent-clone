import React, { useEffect, useRef, useState } from 'react';
import AppShell from '../components/AppShell';
import { apiClient } from '../lib/auth';
import { useAuth } from '../lib/auth';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, Download, Loader2, File as FileIcon, Eye, Code2, Sparkles } from 'lucide-react';

export default function Builder() {
  const { id } = useParams();
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [view, setView] = useState('preview');
  const [activeFile, setActiveFile] = useState(0);
  const [err, setErr] = useState('');
  const scrollRef = useRef(null);

  const ensureProject = async () => {
    setLoading(true);
    try {
      if (id) {
        const r = await apiClient.get(`/projects/${id}`);
        setProject(r.data);
      } else {
        const r = await apiClient.post('/projects', { name: 'New Project' });
        nav(`/builder/${r.data.id}`, { replace: true });
      }
    } catch (e) {
      setErr('Project not found');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { ensureProject(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [project?.messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true); setErr('');
    try {
      const r = await apiClient.post(`/projects/${project.id}/chat`, { message: input });
      setProject(r.data); setInput(''); refresh();
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const download = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    (project.files || []).forEach((f) => zip.file(f.path, f.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.zip`;
    a.click();
  };

  if (loading) return <AppShell><div className="text-neutral-500">Loading…</div></AppShell>;
  if (err && !project) return <AppShell><div className="text-red-600">{err}</div></AppShell>;

  const file = project.files?.[activeFile];
  const html = project.files?.find((f) => f.path === 'index.html')?.content || '';

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900">{project.name}</h1>
          <p className="text-[13px] text-neutral-500">{project.description || 'Describe your app to begin.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={download} disabled={!project.files?.length} className="inline-flex items-center gap-2 rounded-full bg-neutral-100 hover:bg-neutral-200 px-3 py-2 text-[13px] font-medium text-neutral-800 disabled:opacity-50">
            <Download className="w-4 h-4" /> Download .zip
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-180px)]">
        {/* Chat */}
        <div className="bg-white border border-neutral-200 rounded-2xl flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {(project.messages || []).length === 0 && (
              <div className="text-center text-neutral-500 text-[13px] py-10">
                <Sparkles className="w-6 h-6 mx-auto text-neutral-400 mb-2" />
                Tell me what you want to build.
              </div>
            )}
            {project.messages?.map((m) => (
              <div key={m.id} className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'ml-auto bg-neutral-900 text-white rounded-br-md' : 'bg-neutral-100 text-neutral-800 rounded-bl-md'}`}>
                {m.content}
              </div>
            ))}
            {sending && <div className="bg-neutral-100 text-neutral-500 rounded-2xl px-3.5 py-2.5 text-[13px] inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</div>}
          </div>
          {err && <div className="px-4 py-2 text-[12px] text-red-600 bg-red-50 border-t border-red-100">{err}</div>}
          <form onSubmit={send} className="p-3 border-t border-neutral-200 flex items-end gap-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe your app, page or change…" rows={2} className="flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-[13.5px] outline-none focus:border-neutral-900" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }} />
            <button type="submit" disabled={sending || !input.trim()} className="h-10 w-10 rounded-full bg-neutral-900 text-white flex items-center justify-center disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* Preview / Code */}
        <div className="bg-white border border-neutral-200 rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
            <div className="inline-flex bg-neutral-100 rounded-full p-1">
              <button onClick={() => setView('preview')} className={`px-3 py-1 rounded-full text-[12px] font-medium inline-flex items-center gap-1.5 ${view === 'preview' ? 'bg-neutral-900 text-white' : 'text-neutral-700'}`}><Eye className="w-3.5 h-3.5" /> Preview</button>
              <button onClick={() => setView('code')} className={`px-3 py-1 rounded-full text-[12px] font-medium inline-flex items-center gap-1.5 ${view === 'code' ? 'bg-neutral-900 text-white' : 'text-neutral-700'}`}><Code2 className="w-3.5 h-3.5" /> Code</button>
            </div>
            <div className="text-[12px] text-neutral-500">{project.files?.length || 0} file{(project.files?.length||0)===1?'':'s'}</div>
          </div>
          {view === 'preview' ? (
            <iframe title="preview" srcDoc={html || '<div style="font-family:Inter;padding:40px;color:#888;text-align:center">Send a message to generate your app.</div>'} className="flex-1 w-full bg-white" sandbox="allow-scripts" />
          ) : (
            <div className="flex flex-1 min-h-0">
              <div className="w-52 border-r border-neutral-200 overflow-y-auto p-2">
                {(project.files || []).map((f, i) => (
                  <button key={i} onClick={() => setActiveFile(i)} className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12.5px] ${i === activeFile ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}><FileIcon className="w-3.5 h-3.5" /> <span className="truncate">{f.path}</span></button>
                ))}
              </div>
              <pre className="flex-1 overflow-auto p-4 text-[12px] leading-relaxed text-neutral-800 bg-neutral-50"><code>{file?.content || '// No file selected.'}</code></pre>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
