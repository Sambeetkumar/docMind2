import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiFetch } from '../lib/api';

export default function Chat() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState([{ role: 'system', content: 'Ask about your document.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const next = [...messages, { role: 'user', content: input }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const token = await getToken();
      const res = await apiFetch('/api/chat', { method: 'POST', token, body: { documentId: Number(id), messages: next } });
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[75vh]">
      <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-white border rounded">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <span className={`inline-block px-3 py-2 rounded ${m.role === 'user' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
              {m.content}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="mt-2 flex gap-2">
        <input className="flex-1 border rounded px-3 py-2" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question" />
        <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={send} disabled={loading}>{loading ? '...' : 'Send'}</button>
      </div>
    </div>
  );
}
