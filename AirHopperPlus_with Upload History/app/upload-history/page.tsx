'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './upload-history.module.css';

interface UploadLogEntry {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  uploadedBy: string;
  status: 'success' | 'failed';
  remarks?: string;
}

interface PaginatedLogs {
  logs: UploadLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export default function UploadHistory() {
  const [logs, setLogs] = useState<UploadLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Filters
  const [fileNameFilter, setFileNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (fileNameFilter) params.append('fileName', fileNameFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('startDate', dateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const response = await fetch(`/api/upload-history?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load upload history');
    } finally {
      setLoading(false);
    }
  }, [fileNameFilter, statusFilter, dateFilter, endDateFilter, page, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = () => {
    setFileNameFilter('');
    setStatusFilter('');
    setEndDateFilter('');
    setDateFilter('');
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Upload History</h1>
        <a href="/" className={styles.backLink}>← Back to Upload</a>
      </header>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="fileNameFilter">File Name</label>
          <input
            type="text"
            id="fileNameFilter"
            placeholder="Search by file name..."
            value={fileNameFilter}
            onChange={(e) => setFileNameFilter(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="statusFilter">Status</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="dateFilter">From Date</label>
          <input
            type="date"
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="endDateFilter">To Date</label>
          <input
            type="date"
            id="endDateFilter"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterActions}>
          <button onClick={fetchLogs} className={styles.btnPrimary}>
            Search
          </button>
          <button onClick={clearFilters} className={styles.btnSecondary}>
            Clear
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.tableContainer}>
          {logs.length === 0 ? (
            <div className={styles.empty}>No upload records found</div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.fileName}</td>
                      <td>{formatFileSize(log.fileSize)}</td>
                      <td>{log.fileType}</td>
                      <td>{formatDate(log.uploadDate)}</td>
                      <td>
                        <span className={`${styles.status} ${styles[log.status]}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.pagination}>
                <div className={styles.pageInfo}>
                  Showing {logs.length} of {total} records
                </div>
                <div className={styles.pageControls}>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value));
                      setPage(1);
                    }}
                    className={styles.pageSelect}
                  >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={styles.pageBtn}
                  >
                    Previous
                  </button>
                  <span className={styles.pageNumber}>Page {page}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * pageSize >= total}
                    className={styles.pageBtn}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
