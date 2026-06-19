'use client';
import { useState } from 'react';

export default function LeadsTable({ leads }) {
  const [search, setSearch] = useState('');

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No leads found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Phone', 'Listing Address', 'Listing Price', 'Message', 'Date'].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{lead.name}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.email}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{lead.listing_address || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.listing_price || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{lead.message || '—'}</td>
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
    </div>
  );
}
