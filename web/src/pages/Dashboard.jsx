import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiFetch } from '../lib/api';

export default function Dashboard() {
  const { getToken } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const { documents } = await apiFetch('/api/documents', { token });
        setDocs(documents);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Your Documents</h1>
        <Link className="px-3 py-2 bg-indigo-600 text-white rounded" to="/upload">Upload PDF</Link>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="p-3 bg-white rounded border flex items-center justify-between">
              <div>
                <div className="font-medium">{d.file_name}</div>
                <div className="text-sm text-gray-500">{new Date(d.created_at).toLocaleString()}</div>
              </div>
              <div className="space-x-2">
                <Link className="px-2 py-1 border rounded" to={`/doc/${d.id}`}>Open</Link>
                <Link className="px-2 py-1 border rounded" to={`/chat/${d.id}`}>Chat</Link>
                <Link className="px-2 py-1 border rounded" to={`/quiz/${d.id}`}>Quiz</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
