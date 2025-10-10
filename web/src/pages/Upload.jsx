import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiFetch } from '../lib/api';

export default function Upload() {
  const { getToken } = useAuth();
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!file) return setError('Select a PDF file');
    setSubmitting(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append('file', file);
      const res = await apiFetch('/api/upload', { method: 'POST', token, body: form, isForm: true });
      window.location.href = `/doc/${res.document.id}`;
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Upload PDF</h1>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button disabled={submitting} className="px-3 py-2 bg-indigo-600 text-white rounded">
        {submitting ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
