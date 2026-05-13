'use client';

import UploadForm from '@/components/UploadForm';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #00b4db 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        color: 'white',
        padding: '2rem',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        zIndex: 100
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2.5rem',
          fontWeight: 700,
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        }}>
          ✈️ Air Hop Application
        </h1>
        <p style={{ 
          margin: '0.75rem 0 0 0', 
          opacity: 0.95,
          fontSize: '1.1rem'
        }}>
          Upload your files quickly and securely to the cloud
        </p>
      </header>

      <section style={{ padding: '4rem 1rem' }}>
        <UploadForm />
      </section>

      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.875rem'
      }}>
        © 2026 Air Hop Application. All rights reserved.
      </footer>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </main>
  );
}