'use client';

import { useState, useCallback } from 'react';
import styles from './FileList.module.css';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
}

interface FileListProps {
  files: UploadedFile[];
  onDelete: (id: string) => void;
  onClearAll?: () => void;
  onClearFailed?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const icons: Record<string, string> = {
    pdf: '📄',
    docx: '📝',
    doc: '📝',
    xlsx: '📊',
    xls: '📊',
    pptx: '📽️',
    ppt: '📽️',
    csv: '📋',
    txt: '📃',
    xml: '📰',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    bmp: '🖼️',
    tiff: '🖼️',
    mp3: '🎵',
    mp4: '🎬',
  };
  return icons[ext] || '📁';
}

function isPreviewableImage(ext: string): boolean {
  return ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp', 'tiff'].includes(ext.toLowerCase());
}

function isPreviewableText(ext: string): boolean {
  return ['txt', 'csv', 'xml', 'json', 'html', 'css', 'js', 'ts', 'md'].includes(ext.toLowerCase());
}

function isPreviewableMedia(ext: string): boolean {
  return ['mp3', 'mp4', 'wav', 'webm', 'ogg'].includes(ext.toLowerCase());
}

export default function FileList({ files, onDelete, onClearAll, onClearFailed }: FileListProps) {
  const [hoveredFile, setHoveredFile] = useState<UploadedFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const loadPreview = useCallback(async (file: UploadedFile) => {
    const ext = file.file.name.split('.').pop()?.toLowerCase() || '';
    
    if (isPreviewableImage(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewContent(e.target?.result as string);
      reader.readAsDataURL(file.file);
    } else if (isPreviewableText(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Truncate to first 500 chars for preview
        const truncated = text.slice(0, 500) + (text.length > 500 ? '\n\n[... content truncated ...]' : '');
        setPreviewContent(truncated);
      };
      reader.readAsText(file.file);
    } else if (isPreviewableMedia(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewContent(e.target?.result as string);
      reader.readAsDataURL(file.file);
    } else {
      setPreviewContent(`[${ext.toUpperCase()} file - preview not available]`);
    }
  }, []);

  const handleMouseEnter = (file: UploadedFile, e: React.MouseEvent) => {
    setHoveredFile(file);
    // Position preview to the left of the delete button
    const deleteBtn = (e.target as HTMLElement).closest('li')?.querySelector(`.${styles.deleteBtn}`);
    if (deleteBtn) {
      const rect = deleteBtn.getBoundingClientRect();
      setPreviewPosition({ 
        x: rect.left - 340,
        y: rect.top - 10
      });
    } else {
      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      setPreviewPosition({ 
        x: rect.left - 330,
        y: rect.top
      });
    }
    setIsLoadingPreview(true);
    loadPreview(file).finally(() => setIsLoadingPreview(false));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Keep position fixed, no update needed
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Don't hide if moving to the preview itself
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest?.(`.${styles.preview}`)) {
      return;
    }
    setHoveredFile(null);
    setPreviewContent(null);
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <h3 className={styles.title}>Files to Upload ({files.length})</h3>
        <div className={styles.titleActions}>
          {onClearFailed && (
            <button className={styles.clearFailedBtn} onClick={onClearFailed}>
              ✕ Remove Failed
            </button>
          )}
          {onClearAll && (
            <button className={styles.clearAllBtn} onClick={onClearAll}>
              🗑️ Remove All Files
            </button>
          )}
        </div>
      </div>
      <ul className={styles.list}>
        {files.map((file) => (
          <li
            key={file.id}
            className={`${styles.item} ${styles[file.status]}`}
          >
            <span className={styles.icon}>{getFileIcon(file.file.name)}</span>
            <div className={styles.info}>
              <span 
                className={styles.name}
                onMouseEnter={(e) => handleMouseEnter(file, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {file.file.name}
              </span>
              <span className={styles.size}>{formatFileSize(file.file.size)}</span>
              {file.status === 'error' && (
                <span className={styles.errorMsg}>{file.message}</span>
              )}
              {file.status === 'uploading' && (
                <span className={styles.uploading}>Uploading...</span>
              )}
              {file.status === 'success' && (
                <span className={styles.success}>✓ Uploaded</span>
              )}
            </div>
            <button
              className={styles.deleteBtn}
              onClick={() => onDelete(file.id)}
              title="Remove file"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {hoveredFile && (
        <div
          className={styles.preview}
          style={{
            left: Math.min(previewPosition.x + 15, window.innerWidth - 350),
            top: Math.min(previewPosition.y + 15, window.innerHeight - 300),
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className={styles.previewHeader}>
            <span className={styles.previewIcon}>{getFileIcon(hoveredFile.file.name)}</span>
            <span className={styles.previewName}>{hoveredFile.file.name}</span>
          </div>
          <div className={styles.previewContent}>
            {isLoadingPreview && <div className={styles.loading}>Loading preview...</div>}
            {!isLoadingPreview && previewContent && (
              <>
                {isPreviewableImage(hoveredFile.file.name.split('.').pop() || '') && (
                  <img src={previewContent} alt={hoveredFile.file.name} className={styles.previewImage} />
                )}
                {isPreviewableMedia(hoveredFile.file.name.split('.').pop() || '') && (
                  <video controls src={previewContent} className={styles.previewMedia}>
                    Your browser does not support video playback.
                  </video>
                )}
                {isPreviewableText(hoveredFile.file.name.split('.').pop() || '') && (
                  <pre className={styles.previewText}>{previewContent}</pre>
                )}
                {!isPreviewableImage(hoveredFile.file.name.split('.').pop() || '') &&
                 !isPreviewableMedia(hoveredFile.file.name.split('.').pop() || '') &&
                 !isPreviewableText(hoveredFile.file.name.split('.').pop() || '') && (
                  <div className={styles.noPreview}>{previewContent}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}