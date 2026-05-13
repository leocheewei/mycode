import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = 'C:\\Cw\\s3bucket';
const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

const ALLOWED_EXTENSIONS = new Set([
  'docx', 'xlsx', 'pptx', 'pdf', 'csv', 'txt', 'xml',
  'jpg', 'jpeg', 'bmp', 'png', 'tiff', 'mp3', 'mp4'
]);

// Magic byte signatures keyed by extension
const MAGIC_BYTES: Record<string, (buf: Buffer) => boolean> = {
  pdf:  buf => buf.subarray(0, 1024).includes(Buffer.from('%PDF')),
  png:  buf => buf.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A])),
  jpg:  buf => buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF,
  jpeg: buf => buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF,
  bmp:  buf => buf[0] === 0x42 && buf[1] === 0x4D,
  tiff: buf => (buf[0]===0x49 && buf[1]===0x49 && buf[2]===0x2A && buf[3]===0x00) ||
               (buf[0]===0x4D && buf[1]===0x4D && buf[2]===0x00 && buf[3]===0x2A),
  // docx / xlsx / pptx are ZIP archives internally
  docx: buf => buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04,
  xlsx: buf => buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04,
  pptx: buf => buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04,
  mp3:  buf => (buf[0]===0x49 && buf[1]===0x44 && buf[2]===0x33) || // ID3 tag
               (buf[0]===0xFF && (buf[1]===0xFB || buf[1]===0xF3 || buf[1]===0xF2)),
  mp4:  buf => buf.subarray(4, 8).toString('ascii') === 'ftyp',
  // Text-based formats: no null bytes (null bytes indicate binary content)
  csv: buf => !buf.subarray(0, 512).includes(0x00),
  txt: buf => !buf.subarray(0, 512).includes(0x00),
  xml: buf => {
    if (buf.subarray(0, 512).includes(0x00)) return false;
    const start = buf.subarray(0, 64).toString('utf-8').trimStart();
    return start.startsWith('<?xml') || start.startsWith('<');
  },
};

function validateMagicBytes(ext: string, buf: Buffer): boolean {
  const check = MAGIC_BYTES[ext];
  return check ? check(buf) : false;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Check if upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      return NextResponse.json(
        { error: 'Upload folder location not reachable' },
        { status: 500 }
      );
    }

    const results: { name: string; size: number; status: 'success' | 'error'; message: string }[] = [];
    const uploadedFiles: string[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      // Reject empty files
      if (file.size === 0) {
        results.push({
          name: file.name,
          size: file.size,
          status: 'error',
          message: 'File is empty (0 bytes)'
        });
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = `File exceeds maximum size of 300MB`;
        results.push({
          name: file.name,
          size: file.size,
          status: 'error',
          message: errorMsg
        });
        continue;
      }

      // Validate file extension
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        const errorMsg = `File type .${ext} is not allowed`;
        results.push({
          name: file.name,
          size: file.size,
          status: 'error',
          message: errorMsg
        });
        continue;
      }

      // Read buffer once — used for magic byte check and writing
      const buffer = Buffer.from(await file.arrayBuffer());

      // Validate true file type via magic bytes
      if (!validateMagicBytes(ext, buffer)) {
        results.push({
          name: file.name,
          size: file.size,
          status: 'error',
          message: `This file may have been renamed. Only genuine .${ext} files are accepted.`
        });
        continue;
      }

      // Use original filename with collision handling
      let finalPath = path.join(UPLOAD_DIR, file.name);
      let counter = 1;
      while (fs.existsSync(finalPath)) {
        const nameParts = file.name.split('.');
        const fileExt = nameParts.pop();
        const baseName = nameParts.join('.');
        finalPath = path.join(UPLOAD_DIR, `${baseName}_${counter}.${fileExt}`);
        counter++;
      }
      const finalName = path.basename(finalPath);

      // Write file to disk
      try {
        fs.writeFileSync(finalPath, buffer);

        uploadedFiles.push(finalName);
        results.push({
          name: file.name,
          size: file.size,
          status: 'success',
          message: 'File uploaded successfully'
        });
      } catch (writeError) {
        const errMsg = writeError instanceof Error ? writeError.message : 'File write failed';
        results.push({
          name: file.name,
          size: file.size,
          status: 'error',
          message: errMsg
        });
      }
    }

    return NextResponse.json({
      message: 'Upload completed',
      results,
      uploadedFiles
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}