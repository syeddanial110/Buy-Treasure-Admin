'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { sendEmails } from '@/lib/api';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

export default function EmailModal({ leads, onClose }) {
  const [selected, setSelected] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const allSelected = leads.length > 0 && selected.length === leads.length;

  function toggleAll() {
    setSelected(allSelected ? [] : leads.map(l => l.email));
  }

  function toggleLead(email) {
    setSelected(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  }

  async function handleSend() {
    if (selected.length === 0) return toast.error('Select at least one recipient.');
    if (!subject.trim()) return toast.error('Subject is required.');
    if (!body.trim() || body === '<p><br></p>') return toast.error('Message body is required.');

    setSending(true);
    try {
      const recipients = selected.map(email => ({ email, subject, Message: body }));
      await sendEmails(recipients);
      toast.success('Emails sent successfully!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to send emails.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Send Email to Leads</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              <label className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">Select All ({leads.length})</span>
              </label>
              {leads.map(lead => (
                <label key={lead.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selected.includes(lead.email)}
                    onChange={() => toggleLead(lead.email)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{lead.name}</span>
                    <span className="text-gray-400 ml-2">{lead.email}</span>
                  </span>
                </label>
              ))}
            </div>
            {selected.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {selected.length} recipient{selected.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject…"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <ReactQuill
              value={body}
              onChange={setBody}
              theme="snow"
              modules={quillModules}
              placeholder="Write your message here…"
              style={{ minHeight: '160px' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {sending ? 'Sending…' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
