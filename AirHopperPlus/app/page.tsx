'use client';

import { useState, useCallback } from 'react';
import { version } from '@/package.json';
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
    setUploadResult(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      const successFiles = updated.filter(f => f.status === 'success');
      const errorFiles = updated.filter(f => f.status === 'error');

      if (errorFiles.length === 0 && successFiles.length > 0) {
        setUploadResult({
          success: true,
          message: `Successfully uploaded ${successFiles.length} file(s) to C:\\Cw\\s3bucket`
        });
      } else if (successFiles.length === 0 && errorFiles.length === 0) {
        setUploadResult(null);
      } else if (errorFiles.length > 0) {
        const total = successFiles.length + errorFiles.length;
        setUploadResult({
          success: false,
          message: successFiles.length > 0
            ? `${successFiles.length} of ${total} file(s) uploaded. Check individual files for errors.`
            : `All ${total} file(s) failed to upload. Check individual files for errors.`
        });
      }

      return updated;
    });
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

      const successCount = result.results?.filter((r: { status: string }) => r.status === 'success').length ?? 0;
      const allSucceeded = response.ok && successCount === pendingFiles.length;
      const someSucceeded = successCount > 0 && successCount < pendingFiles.length;

      setUploadResult({
        success: allSucceeded,
        message: allSucceeded
          ? `Successfully uploaded ${successCount} file(s) to C:\\Cw\\s3bucket`
          : someSucceeded
          ? `${successCount} of ${pendingFiles.length} file(s) uploaded. Check individual files for errors.`
          : (result.error || (pendingFiles.length === 1
              ? 'The file failed to upload. Check the file for errors.'
              : `All ${pendingFiles.length} files failed to upload. Check individual files for errors.`))
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
  const failedCount = files.filter(f => f.status === 'error').length;

  const handleClearFailed = useCallback(() => {
    setFiles(prev => {
      const updated = prev.filter(f => f.status !== 'error');
      const successFiles = updated.filter(f => f.status === 'success');
      if (successFiles.length > 0) {
        setUploadResult({
          success: true,
          message: `Successfully uploaded ${successFiles.length} file(s) to C:\\Cw\\s3bucket`
        });
      } else {
        setUploadResult(null);
      }
      return updated;
    });
  }, []);

  const selectedSize = files
    .filter(f => f.status === 'pending')
    .reduce((acc, f) => acc + f.file.size, 0);
  const remaining = MAX_SIZE - selectedSize;
  const usedPercent = (selectedSize / MAX_SIZE) * 100;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Air Hopper Plus</h1>
      </header>

      <div className={styles.card}>
        <FileDropzone
          onFilesSelected={handleFilesSelected}
          allowedTypes={ALLOWED_TYPES}
          maxSize={MAX_SIZE}
        />

        <FileList
          files={files}
          onDelete={handleDelete}
          onClearAll={pendingCount > 0 ? () => { setFiles([]); setUploadResult(null); } : undefined}
          onClearFailed={failedCount > 0 ? handleClearFailed : undefined}
        />

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
          uploadResult.success ? (
            <button
              className={`${styles.message} ${styles.success} ${styles.successButton}`}
              onClick={() => window.location.reload()}
            >
              {uploadResult.message}
              <span className={styles.refreshHint}>Return to main page</span>
            </button>
          ) : (
            <div className={`${styles.message} ${styles.error}`}>
              {uploadResult.message}
            </div>
          )
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        fileCount={pendingCount}
        totalSize={totalSize}
        onConfirm={handleUpload}
        onCancel={() => setShowConfirm(false)}
      />

      <footer className={styles.footer}>v{version}</footer>
    </main>
  );
}