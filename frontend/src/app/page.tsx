'use client';

import React from 'react';

export default function HomePage() {
  return (
    <main className="w-full h-screen overflow-hidden bg-black m-0 p-0">
      <iframe
        src="/omnerat.html"
        className="w-full h-full border-0 block m-0 p-0"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="JAN-DRISHTI - Evidence-Linked Risk Intelligence for MPLADS"
      />
    </main>
  );
}
