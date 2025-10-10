import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiFetch } from '../lib/api';

export default function History() {
  const { getToken } = useAuth();
  const [chats, setChats] = useState([]);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const [{ chats }, { attempts }] = await Promise.all([
        apiFetch('/api/history/chats', { token }),
        apiFetch('/api/history/quizzes', { token }),
      ]);
      setChats(chats);
      setAttempts(attempts);
    })();
  }, [getToken]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Chats</h2>
        <div className="space-y-2">
          {chats.map((c) => (
            <div key={c.id} className="p-3 bg-white border rounded">
              <div className="text-sm text-gray-500">{new Date(c.created_at).toLocaleString()}</div>
              <div className="line-clamp-2 text-sm">{c.response}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Quiz Attempts</h2>
        <div className="space-y-2">
          {attempts.map((a) => (
            <div key={a.id} className="p-3 bg-white border rounded">
              <div className="text-sm text-gray-500">{new Date(a.created_at).toLocaleString()}</div>
              <div className="font-medium">Score: {a.score}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
