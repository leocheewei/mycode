'use client';

import styles from './ConfirmationModal.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  fileCount: number;
  totalSize: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ConfirmationModal({
  isOpen,
  fileCount,
  totalSize,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Confirm Upload</h2>
        <p className={styles.message}>
          Are you sure you want to upload <strong>{fileCount} file{fileCount !== 1 ? 's' : ''}</strong>?
        </p>
        <p className={styles.size}>
          Total size: <strong>{formatFileSize(totalSize)}</strong>
        </p>
        
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            Upload Now
          </button>
        </div>
      </div>
    </div>
  );
}