'use client';

import { useState, useRef } from 'react';

interface UploadFormProps {
  onUploadComplete?: (data: { filename: string; url: string; size: number }) => void;
}

export default function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ filename: string; url: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setMessage(null);
    setUploadedFile(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadedFile(data);
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
      onUploadComplete?.(data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="upload-container">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".docx,.xlsx,.pptx,.pdf,.csv,.txt,.xml,.jpg,.jpeg,.bmp,.png,.tiff,.mp3,.mp4"
          style={{ display: 'none' }}
        />

        {isUploading ? (
          <div className="upload-progress">
            <div className="spinner"></div>
            <p>Uploading...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              Drag and drop a file here, or <span className="browse-link">browse</span>
            </p>
            <p className="upload-hint">
              Max file size: 300MB • docx, xlsx, pptx, pdf, csv, txt, xml, jpg, jpeg, bmp, png, tiff, mp3, mp4
            </p>
          </>
        )}
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {uploadedFile && (
        <div className="uploaded-file">
          <h3>Uploaded File:</h3>
          <p><strong>Name:</strong> {uploadedFile.filename}</p>
          <p><strong>Size:</strong> {formatFileSize(uploadedFile.size)}</p>
          <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer">
            View File →
          </a>
        </div>
      )}

      <style jsx>{`
        .upload-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
        }

        .drop-zone {
          border: 3px dashed rgba(255, 255, 255, 0.5);
          border-radius: 20px;
          padding: 4rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .drop-zone:hover {
          border-color: #ffd700;
          transform: translateY(-5px);
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
        }

        .drop-zone.dragging {
          border-color: #ffd700;
          background: linear-gradient(135deg, #fff9e6 0%, #fff5cc 100%);
          transform: scale(1.03);
        }

        .drop-zone.uploading {
          pointer-events: none;
          opacity: 0.8;
        }

        .upload-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }

        .upload-text {
          font-size: 1.3rem;
          color: #333;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .browse-link {
          color: #667eea;
          font-weight: 700;
          text-decoration: underline;
        }

        .upload-hint {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.6;
        }

        .upload-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(102, 126, 234, 0.2);
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .message {
          margin-top: 1.5rem;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          text-align: center;
          font-weight: 500;
        }

        .message.success {
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .uploaded-file {
          margin-top: 2rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
        }

        .uploaded-file h3 {
          margin: 0 0 1.5rem 0;
          color: #667eea;
          font-size: 1.3rem;
        }

        .uploaded-file p {
          margin: 0.75rem 0;
          color: #444;
          font-size: 1rem;
        }

        .uploaded-file a {
          display: inline-block;
          margin-top: 1.25rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: transform 0.2s;
        }

        .uploaded-file a:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}