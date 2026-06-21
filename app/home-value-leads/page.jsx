'use client';
import { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import EmailModal from '@/components/EmailModal';
import { getHomeValueLeads } from '@/lib/api';
import toast from 'react-hot-toast';

export default function HomeValueLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getHomeValueLeads()
      .then(setLeads)
      .catch(err => toast.error(err.message || 'Failed to fetch home value leads'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return l.full_name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
  });

  const leadsForModal = leads.map(l => ({ id: l.id, name: l.full_name, email: l.email }));

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Home Value Leads</h1>
            {!loading && (
              <p className="text-sm text-gray-500 mt-1">{leads.length} total leads</p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Email
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-gray-100 rounded" />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {filtered.length === 0 ? (
                <p className="p-6 text-sm text-gray-500">No leads found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Email', 'Property Address', 'Size (sq ft)', 'Beds', 'Baths', 'Date'].map(col => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{lead.full_name}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.email}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate">{lead.property_address || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.house_size ? lead.house_size.toLocaleString() : '—'}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.bedrooms ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.bathrooms ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {showModal && (
          <EmailModal leads={leadsForModal} onClose={() => setShowModal(false)} />
        )}
      </div>
    </ProtectedLayout>
  );
}
