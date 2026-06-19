import ProtectedLayout from '@/components/ProtectedLayout';

export default function HomeValueLeadsPage() {
  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Home Value Leads</h1>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-500">Home Value Leads — Coming Soon</h2>
          <p className="text-sm text-gray-400 mt-2">This section will be available once the API endpoint is ready.</p>
        </div>
      </div>
    </ProtectedLayout>
  );
}
