import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'File Upload',
  description: 'Upload files to C:\\Cw\\s3bucket',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}