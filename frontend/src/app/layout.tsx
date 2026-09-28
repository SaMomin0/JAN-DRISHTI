import './globals.css';
import type { Metadata } from 'next';
import { AppShell } from '../components/layout/AppShell';

export const metadata: Metadata = {
  title: 'JAN-DRISHTI | Evidence-Linked Risk Intelligence for MPLADS',
  description: 'Evidence-Linked Risk Intelligence, Empirical Anomaly Detection & Prioritised Verification Platform for MPLADS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-[#fbfbfd] text-[rgb(26,26,26)] min-h-screen antialiased selection:bg-[#BDB2FF]/35 selection:text-black">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
