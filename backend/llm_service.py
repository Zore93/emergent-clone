import os
import json
import re
from typing import List, Dict
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

SYSTEM_PROMPT = (
    "You are an expert AI app-builder copilot for the Emergent platform. "
    "Given a user's request, design and produce a complete, runnable, full-stack web app or website. "
    "Always answer with strict JSON only — no markdown fences, no commentary outside JSON. "
    "The JSON object MUST have this shape exactly: "
    '{"reply": string, "project_name": string, "description": string, '
    '"files": [ {"path": string, "language": string, "content": string } ] }. '
    "`reply` is the assistant\u2019s natural-language summary shown in the chat (one short paragraph). "
    "`project_name` should be a short kebab/title-case name. "
    "`description` is a one-line description of the app. "
    "`files` MUST contain at least: index.html (with inline <style> and <script>), README.md. "
    "For richer apps, you can also add additional files like src/app.js, styles.css, etc. "
    "Keep total file content under ~12 KB. Use modern, semantic HTML and clean Tailwind-like CSS in <style> when possible. "
    "Never invent third-party API keys. If the request needs a backend, provide the frontend that calls a documented (mock) endpoint and explain in README how to wire it up."
)

FALLBACK_HTML = (
    '<!doctype html><html><head><meta charset="utf-8"><title>{name}</title>'
    '<style>body{{font-family:Inter,sans-serif;margin:0;padding:60px 24px;background:#fafafa;color:#111;text-align:center}}'
    'h1{{font-size:42px;margin:0 0 12px}}p{{color:#555;max-width:560px;margin:0 auto}}'
    '.card{{max-width:640px;margin:40px auto;padding:32px;background:#fff;border-radius:16px;box-shadow:0 10px 40px -10px rgba(0,0,0,.1)}}'
    '</style></head><body><div class="card"><h1>{name}</h1><p>{desc}</p></div></body></html>'
)

async def generate_app(session_id: str, history: List[Dict[str, str]], user_message: str) -> Dict:
    """Run Claude Sonnet 4.5 to generate a project from the chat history.
    This function NEVER raises — on any failure it returns a fallback project."""
    if not EMERGENT_LLM_KEY:
        return _fallback(user_message, error='EMERGENT_LLM_KEY missing')

    try:
        chat = (
            LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=SYSTEM_PROMPT)
            .with_model('anthropic', 'claude-sonnet-4-5-20250929')
            .with_max_tokens(8000)
        )
    except Exception as e:
        return _fallback(user_message, error=f'LLM init failed: {e}')

    # Build context from prior history (excluding the new message)
    context = ''
    for m in history[-10:]:
        role = m.get('role', 'user')
        context += f"\n[{role}]: {m.get('content','')[:1200]}"
    prompt = (
        (f"Conversation so far:{context}\n\n" if context else '')
        + f"User request:\n{user_message}\n\nRespond with the JSON object only."
    )

    try:
        raw = await chat.send_message(UserMessage(text=prompt))
        text = raw.strip() if isinstance(raw, str) else str(raw)
    except Exception as e:
        return _fallback(user_message, error=f'LLM error: {e}')

    try:
        parsed = _extract_json(text)
        if not parsed:
            return _fallback(user_message, error='Could not parse JSON from model', reply=text[:600])

        files = parsed.get('files') or []
        cleaned = []
        for f in files[:12]:
            if not isinstance(f, dict):
                continue
            cleaned.append({
                'path': str(f.get('path', 'index.html'))[:120],
                'language': str(f.get('language', 'text'))[:30],
                'content': str(f.get('content', ''))[:20000],
            })
        if not cleaned:
            cleaned = [{'path': 'index.html', 'language': 'html',
                        'content': FALLBACK_HTML.format(name=parsed.get('project_name','My App'),
                                                        desc=parsed.get('description',''))}]

        return {
            'reply': str(parsed.get('reply', ''))[:2000] or 'Here is your project.',
            'project_name': str(parsed.get('project_name', 'Untitled App'))[:80],
            'description': str(parsed.get('description', ''))[:240],
            'files': cleaned,
        }
    except Exception as e:
        return _fallback(user_message, error=f'Post-process error: {e}')

def _extract_json(text: str):
    # Strip ``` fences if any
    text = re.sub(r'^```(?:json)?\s*', '', text.strip())
    text = re.sub(r'\s*```$', '', text.strip())
    try:
        return json.loads(text)
    except Exception:
        pass
    # Try to grab outermost {...}
    m = re.search(r'\{[\s\S]*\}', text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            return None
    return None

def _fallback(message: str, error: str = '', reply: str = '') -> Dict:
    name = (message[:40] or 'Untitled App').title()
    return {
        'reply': reply or f"I drafted a quick starter for: {name}. (Note: {error})",
        'project_name': name,
        'description': f'Starter generated for: {message[:120]}',
        'files': [{
            'path': 'index.html', 'language': 'html',
            'content': FALLBACK_HTML.format(name=name, desc=message[:200]),
        }],
    }
