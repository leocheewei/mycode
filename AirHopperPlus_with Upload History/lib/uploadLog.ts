import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export interface UploadLogEntry {
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

const LOG_DIR = 'C:\\Cw\\s3bucket\\upload-records';
const LOG_FILE = path.join(LOG_DIR, 'uploads.json');
const RETENTION_DAYS = 30;

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) {
    throw new Error('Upload folder location not reachable');
  }
}

function readLogs(): UploadLogEntry[] {
  ensureLogDir();
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeLogs(logs: UploadLogEntry[]): void {
  ensureLogDir();
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

function cleanupOldLogs(logs: UploadLogEntry[]): UploadLogEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  return logs.filter(log => new Date(log.uploadDate) >= cutoff);
}

export function addUploadLog(entry: Omit<UploadLogEntry, 'id' | 'uploadDate'>): UploadLogEntry {
  const logs = readLogs();
  const newEntry: UploadLogEntry = {
    ...entry,
    id: `upl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    uploadDate: new Date().toISOString(),
  };
  logs.unshift(newEntry);
  const cleanedLogs = cleanupOldLogs(logs);
  writeLogs(cleanedLogs);
  return newEntry;
}

export function getUploadLogs(filters?: {
  fileName?: string;
  status?: 'success' | 'failed';
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): PaginatedLogs {
  let logs = readLogs();

  if (filters) {
    if (filters.fileName) {
      const search = filters.fileName.toLowerCase();
      logs = logs.filter(log => log.fileName.toLowerCase().includes(search));
    }
    if (filters.status) {
      logs = logs.filter(log => log.status === filters.status);
    }
    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.uploadDate) >= new Date(filters.startDate!));
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setDate(end.getDate() + 1); // Include the entire end date day
      logs = logs.filter(log => new Date(log.uploadDate) < end);
    }
  }

  const total = logs.length;
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paginatedLogs = logs.slice(start, start + pageSize);

  return { logs: paginatedLogs, total, page, pageSize };
}
