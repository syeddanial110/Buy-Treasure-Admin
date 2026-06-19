'use client';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }) {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      {children}
    </>
  );
}
