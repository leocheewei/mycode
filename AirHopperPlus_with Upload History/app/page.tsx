'use client';

import { useState, useCallback } from 'react';
import FileDropzone from './components/FileDropzone';
import FileList, { UploadedFile } from './components/FileList';
import ConfirmationModal from './components/ConfirmationModal';
import styles from './page.module.css';

const ALLOWED_TYPES = [
  'docx', 'xlsx', 'pptx', 'pdf', 'csv', 'txt', 'xml',
  'jpg', 'jpeg', 'bmp', 'png', 'tiff', 'mp3', 'mp4'
];
const MAX_SIZE = 300 * 1024 * 1024; // 300MB

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleUpload = useCallback(async () => {
    setShowConfirm(false);
    setIsUploading(true);
    setUploadResult(null);

    // Mark all pending files as uploading
    setFiles(prev => prev.map(f => 
      f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
    ));

    try {
      const formData = new FormData();
      const pendingFiles = files.filter(f => f.status === 'pending');
      
      for (const fileData of pendingFiles) {
        formData.append('files', fileData.file);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      // Update file statuses based on results
      setFiles(prev => prev.map(f => {
        if (f.status !== 'uploading') return f;
        
        const fileResult = result.results?.find(
          (r: { name: string }) => r.name === f.file.name
        );
        
        if (fileResult?.status === 'error') {
          return { ...f, status: 'error' as const, message: fileResult.message };
        }
        return { ...f, status: 'success' as const };
      }));

      setUploadResult({
        success: response.ok,
        message: response.ok 
          ? `Successfully uploaded ${pendingFiles.length} file(s) to C:\\Cw\\s3bucket` 
          : (result.error || 'Some files failed to upload')
      });

    } catch (error) {
      setUploadResult({ success: false, message: 'Upload failed. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  }, [files]);

  const totalSize = files
    .filter(f => f.status === 'pending')
    .reduce((acc, f) => acc + f.file.size, 0);

  const pendingCount = files.filter(f => f.status === 'pending').length;

  const selectedSize = files
    .filter(f => f.status === 'pending')
    .reduce((acc, f) => acc + f.file.size, 0);
  const remaining = MAX_SIZE - selectedSize;
  const usedPercent = (selectedSize / MAX_SIZE) * 100;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Air Hopper Plus</h1>
        <a href="/upload-history" className={styles.historyLink}>Upload History</a>
      </header>

      <div className={styles.card}>
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          allowedTypes={ALLOWED_TYPES}
          maxSize={MAX_SIZE}
        />

        <FileList files={files} onDelete={handleDelete} onClearAll={pendingCount > 0 ? () => setFiles([]) : undefined} />

        {pendingCount > 0 && (
          <div className={styles.storageInfo}>
            <div className={styles.storageBar}>
              <div
                className={`${styles.storageUsed} ${remaining < 0 ? styles.exceeded : ''}`}
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>
            <div className={`${styles.storageText} ${remaining < 0 ? styles.errorText : ''}`}>
              {pendingCount} file{pendingCount !== 1 ? 's' : ''} · {formatSize(selectedSize)} of {formatSize(MAX_SIZE)}
              {remaining < 0 ? (
                <span className={styles.storageError}> (exceeds limit by {formatSize(Math.abs(remaining))})</span>
              ) : (
                <span className={styles.storageRemaining}>({formatSize(remaining)} available)</span>
              )}
            </div>
          </div>
        )}

        {pendingCount > 0 && (
          <div className={styles.actions}>
            <button
              className={styles.btnPrimary}
              onClick={() => setShowConfirm(true)}
              disabled={isUploading || remaining < 0}
            >
              {isUploading ? 'Uploading...' : `Upload ${pendingCount} File${pendingCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {uploadResult && (
          <div className={`${styles.message} ${uploadResult.success ? styles.success : styles.error}`}>
            {uploadResult.message}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        fileCount={pendingCount}
        totalSize={totalSize}
        onConfirm={handleUpload}
        onCancel={() => setShowConfirm(false)}
      />
    </main>
  );
}