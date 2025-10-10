import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { apiFetch } from '../lib/api';

export default function DocumentView() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const { documents } = await apiFetch('/api/documents', { token });
        const match = (documents || []).find((d) => String(d.id) === String(id));
        setDoc(match || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, getToken]);

  if (loading) return <p>Loading...</p>;
  if (!doc) return <p>Not found</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{doc.file_name}</h1>
        <div className="space-x-2">
          <Link className="px-3 py-2 border rounded" to={`/chat/${doc.id}`}>Chat</Link>
          <Link className="px-3 py-2 border rounded" to={`/quiz/${doc.id}`}>Start Quiz</Link>
        </div>
      </div>
      <iframe title="pdf" className="w-full h-[75vh] bg-white border" src={doc.file_url}></iframe>
    </div>
  );
}
