'use client';

import { useCallback, useState } from 'react';
import styles from './FileDropzone.module.css';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  allowedTypes: string[];
  maxSize: number;
}

function formatMaxSize(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(0) + ' MB';
}

export default function FileDropzone({ onFilesSelected, allowedTypes, maxSize }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback((fileList: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    const files = Array.from(fileList);
    const allowedSet = new Set(allowedTypes.map(t => t.toLowerCase()));

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      
      if (file.size === 0) {
        errors.push(`${file.name}: File is empty (0 bytes)`);
        continue;
      }

      if (!allowedSet.has(ext)) {
        errors.push(`${file.name}: Invalid file type (.${ext})`);
        continue;
      }

      if (file.size > maxSize) {
        errors.push(`${file.name}: Exceeds 300MB limit`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError(null);
    }

    return validFiles;
  }, [allowedTypes, maxSize]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [validateFiles, onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
    e.target.value = '';
  }, [validateFiles, onFilesSelected]);

  return (
    <div className={styles.dropzone}>
      <div
        className={`${styles.dropArea} ${isDragging ? styles.dragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="fileInput"
          multiple
          onChange={handleFileInput}
          className={styles.fileInput}
          accept={allowedTypes.join(',')}
        />
        <label htmlFor="fileInput" className={styles.label}>
          <div className={styles.icon}>📁</div>
          <div className={styles.text}>
            Drag and drop files here or <span className={styles.browse}>browse</span>
          </div>
          <div className={styles.infoBox}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Max Size</span>
              <span className={styles.infoValue}>{formatMaxSize(maxSize)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Allowed Types</span>
              <span className={styles.infoValue} style={{ fontSize: '12px', maxWidth: '280px' }}>{allowedTypes.join(', ')}</span>
            </div>
          </div>
        </label>
      </div>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
}