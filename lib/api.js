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
