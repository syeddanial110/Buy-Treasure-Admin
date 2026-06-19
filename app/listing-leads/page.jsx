'use client';
import { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import LeadsTable from '@/components/LeadsTable';
import EmailModal from '@/components/EmailModal';
import { getListingLeads } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ListingLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getListingLeads()
      .then(setLeads)
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Listing Leads</h1>
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

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-gray-100 rounded" />)}
          </div>
        ) : (
          <LeadsTable leads={leads} />
        )}

        {showModal && (
          <EmailModal leads={leads} onClose={() => setShowModal(false)} />
        )}
      </div>
    </ProtectedLayout>
  );
}
