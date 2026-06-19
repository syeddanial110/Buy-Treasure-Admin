# Buy Treasure Coast Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete protected admin panel (Next.js 14, JavaScript, Tailwind) with JWT auth, leads management, and bulk email sending.

**Architecture:** Next.js 14 App Router (JavaScript only); JWT stored in `admin_token` cookie; middleware guards all routes except `/login`; a single `lib/api.js` module attaches Bearer tokens to all backend calls.

**Tech Stack:** Next.js 14, Tailwind CSS, react-quill (rich text editor), cookies-next (cookie r/w), react-hot-toast (toasts)

## Global Constraints

- JavaScript only — no `.ts` or `.tsx` files
- Next.js 14 App Router (`app/` directory)
- Backend base URL: `process.env.NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:5000`)
- Cookie name: `admin_token`
- All protected API calls: `Authorization: Bearer <token>` header
- Email endpoint: `POST /api/email/send` (body: `{ recipients: [{email, subject, Message}] }`)
- Login response shape: `{ token }`
- Leads response shape: `{ leads: [{id, name, email, phone, message, listing_key, listing_address, listing_price, lead_type, created_at}] }`

---

### Task 1: Project Bootstrap

**Files:**
- Create: `(project root)` — Next.js 14 scaffold
- Create: `.env.local`

- [ ] **Step 1: Scaffold Next.js 14 project**

Run from `admin/` directory (empty, so `.` works as project root):
```bash
npx create-next-app@latest . --javascript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```
When prompted, press Enter to confirm the directory. Expected: creates `package.json`, `app/`, `public/`, `tailwind.config.js`, etc.

- [ ] **Step 2: Install additional dependencies**
```bash
npm install react-quill cookies-next react-hot-toast
```
Expected: All packages install without error.

- [ ] **Step 3: Create .env.local**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

- [ ] **Step 4: Verify dev server starts**
```bash
npm run dev
```
Expected: Server starts on http://localhost:3000 (or 3001 if taken). Default Next.js page loads.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: scaffold Next.js 14 admin panel"
```

---

### Task 2: Auth Infrastructure

**Files:**
- Create: `middleware.js`
- Create: `lib/api.js`

**Interfaces:**
- Produces: `loginAdmin(email, password)` → `Promise<{token}>`, `getListingLeads()` → `Promise<Lead[]>`, `sendEmails(recipients)` → `Promise<any>`

- [ ] **Step 1: Create middleware.js**

```js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('admin_token');
  const { pathname } = request.nextUrl;

  if (pathname === '/login') {
    if (token) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

- [ ] **Step 2: Create lib/api.js**

```js
import { getCookie } from 'cookies-next';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function authHeaders() {
  const token = getCookie('admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function loginAdmin(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function getListingLeads() {
  const res = await fetch(`${BASE_URL}/api/listing-leads`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch leads');
  return data.leads;
}

export async function sendEmails(recipients) {
  const res = await fetch(`${BASE_URL}/api/email/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ recipients }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send emails');
  return data;
}
```

- [ ] **Step 3: Commit**
```bash
git add middleware.js lib/api.js
git commit -m "feat: auth middleware and API utility"
```

---

### Task 3: Root Layout + Login Page

**Files:**
- Modify: `app/layout.js`
- Create: `app/login/page.jsx`

**Interfaces:**
- Consumes: `loginAdmin(email, password)` from `lib/api.js`
- Consumes: `setCookie` from `cookies-next`

- [ ] **Step 1: Update app/layout.js**

```jsx
import { Geist } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const geist = Geist({ subsets: ['latin'] });

export const metadata = {
  title: 'Admin — Buy Treasure Coast',
  description: 'Admin panel for Buy Treasure Coast Property',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 antialiased`}>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create app/login/page.jsx**

```jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import { loginAdmin } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token } = await loginAdmin(email, password);
      setCookie('admin_token', token, { maxAge: 60 * 60 * 24 * 7 });
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Buy Treasure Coast</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add app/layout.js app/login/
git commit -m "feat: root layout with Toaster and login page"
```

---

### Task 4: Sidebar + ProtectedLayout

**Files:**
- Create: `components/Sidebar.jsx`
- Create: `components/ProtectedLayout.jsx`

**Interfaces:**
- Produces: `<Sidebar />` (client component, uses `usePathname`, `deleteCookie`)
- Produces: `<ProtectedLayout>{ children }</ProtectedLayout>`

- [ ] **Step 1: Create components/Sidebar.jsx**

```jsx
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { deleteCookie } from 'cookies-next';

const navLinks = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/listing-leads',
    label: 'Listing Leads',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/home-value-leads',
    label: 'Home Value Leads',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    deleteCookie('admin_token');
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Buy Treasure</h2>
        <p className="text-xs text-gray-400 mt-0.5">Coast Admin</p>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navLinks.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create components/ProtectedLayout.jsx**

```jsx
import Sidebar from './Sidebar';

export default function ProtectedLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add components/
git commit -m "feat: Sidebar and ProtectedLayout components"
```

---

### Task 5: StatCard + Dashboard Page

**Files:**
- Create: `components/StatCard.jsx`
- Create: `app/dashboard/page.jsx`

**Interfaces:**
- Consumes: `getListingLeads()` from `lib/api.js`
- Consumes: `<ProtectedLayout>` from `components/ProtectedLayout.jsx`
- Consumes: `<StatCard title value color icon />` (defined in this task)

- [ ] **Step 1: Create components/StatCard.jsx**

```jsx
export default function StatCard({ title, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create app/dashboard/page.jsx**

```jsx
'use client';
import { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import StatCard from '@/components/StatCard';
import { getListingLeads } from '@/lib/api';
import toast from 'react-hot-toast';

function computeStats(leads) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    total: leads.length,
    today: leads.filter(l => new Date(l.created_at) >= todayStart).length,
    thisMonth: leads.filter(l => new Date(l.created_at) >= monthStart).length,
    recent: leads.slice(0, 5),
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListingLeads()
      .then(leads => setStats(computeStats(leads)))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <StatCard
              title="Total Leads"
              value={stats.total}
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <StatCard
              title="Today's Leads"
              value={stats.today}
              color="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatCard
              title="This Month"
              value={stats.thisMonth}
              color="purple"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Leads</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 animate-pulse space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 rounded" />)}
              </div>
            ) : !stats || stats.recent.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">No leads yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name', 'Email', 'Phone', 'Date'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recent.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
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
    </ProtectedLayout>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add components/StatCard.jsx app/dashboard/
git commit -m "feat: StatCard component and Dashboard page"
```

---

### Task 6: LeadsTable Component

**Files:**
- Create: `components/LeadsTable.jsx`

**Interfaces:**
- Consumes: `leads` prop — array of `{id, name, email, phone, listing_address, listing_price, message, created_at}`
- Produces: `<LeadsTable leads={leads} />`

- [ ] **Step 1: Create components/LeadsTable.jsx**

```jsx
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
```

- [ ] **Step 2: Commit**
```bash
git add components/LeadsTable.jsx
git commit -m "feat: reusable LeadsTable component with search"
```

---

### Task 7: EmailModal Component

**Files:**
- Create: `components/EmailModal.jsx`

**Interfaces:**
- Consumes: `leads` prop — array of `{id, name, email}` minimum
- Consumes: `onClose` prop — `() => void`
- Consumes: `sendEmails(recipients)` from `lib/api.js`
- Produces: `<EmailModal leads={leads} onClose={fn} />`

- [ ] **Step 1: Create components/EmailModal.jsx**

```jsx
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
```

- [ ] **Step 2: Commit**
```bash
git add components/EmailModal.jsx
git commit -m "feat: EmailModal with react-quill rich text editor"
```

---

### Task 8: Listing Leads Page

**Files:**
- Create: `app/listing-leads/page.jsx`

**Interfaces:**
- Consumes: `getListingLeads()` from `lib/api.js`
- Consumes: `<ProtectedLayout>`, `<LeadsTable leads />`, `<EmailModal leads onClose />`

- [ ] **Step 1: Create app/listing-leads/page.jsx**

```jsx
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
```

- [ ] **Step 2: Commit**
```bash
git add app/listing-leads/
git commit -m "feat: Listing Leads page with table and email modal"
```

---

### Task 9: Home Value Leads Placeholder

**Files:**
- Create: `app/home-value-leads/page.jsx`

**Interfaces:**
- Consumes: `<ProtectedLayout>`

- [ ] **Step 1: Create app/home-value-leads/page.jsx**

```jsx
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
```

- [ ] **Step 2: Commit**
```bash
git add app/home-value-leads/
git commit -m "feat: Home Value Leads placeholder page"
```

---

## Self-Review

**Spec coverage:**
- ✅ /login — centered form, POST /api/auth/login, save JWT to `admin_token` cookie, redirect to /dashboard, error toast on failure
- ✅ /dashboard — sidebar nav, stat cards (Total/Today/Month), recent 5 leads table, logout clears cookie
- ✅ /listing-leads — full table with all 7 columns, sorted newest first (API returns DESC order), search by name or email
- ✅ Send Email button → EmailModal — multi-select with Select All, subject field, react-quill rich text, POST /api/email/send with correct body shape
- ✅ /home-value-leads — placeholder with sidebar
- ✅ middleware.js — checks `admin_token` cookie, redirects to /login if missing, redirects logged-in users away from /login
- ✅ lib/api.js — `loginAdmin`, `getListingLeads`, `sendEmails` all with Bearer token headers
- ✅ All 5 components: Sidebar, StatCard, LeadsTable, EmailModal, ProtectedLayout

**Spec correction:** Email endpoint is `POST /api/email/send` (not `/api/email` as in spec) — confirmed from backend `src/routes/email.js`.

**Placeholder scan:** No TBDs, TODOs, or incomplete steps found.

**Type consistency:** `loginAdmin`, `getListingLeads`, `sendEmails` used consistently in all tasks that reference them. `<ProtectedLayout>`, `<LeadsTable leads>`, `<EmailModal leads onClose>` prop signatures consistent across definition and usage tasks.
