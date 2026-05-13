import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { addUploadLog } from '@/lib/uploadLog';

const UPLOAD_DIR = 'C:\\Cw\\s3bucket';
const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB
const UPLOADED_BY = 'user@example.com'; // TODO: Replace with actual user authentication

const ALLOWED_EXTENSIONS = new Set([
  'docx', 'xlsx', 'pptx', 'pdf', 'csv', 'txt', 'xml',
  'jpg', 'jpeg', 'bmp', 'png', 'tiff', 'mp3', 'mp4'
]);

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
      // Validate file size
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = `File exceeds maximum size of 300MB`;
        results.push({
          name: file.name,
          size: file.size,
          status: 'error',
          message: errorMsg
        });
        addUploadLog({
          fileName: file.name,
          fileSize: file.size,
          fileType: ext,
          uploadedBy: UPLOADED_BY,
          status: 'failed',
          remarks: errorMsg
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
        addUploadLog({
          fileName: file.name,
          fileSize: file.size,
          fileType: ext,
          uploadedBy: UPLOADED_BY,
          status: 'failed',
          remarks: errorMsg
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
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(finalPath, buffer);

        uploadedFiles.push(finalName);
        results.push({
          name: file.name,
          size: file.size,
          status: 'success',
          message: 'File uploaded successfully'
        });

        // Log successful upload
        addUploadLog({
          fileName: finalName,
          fileSize: file.size,
          fileType: ext,
          uploadedBy: UPLOADED_BY,
          status: 'success',
          remarks: 'File uploaded successfully'
        });
      } catch (writeError) {
        const errMsg = writeError instanceof Error ? writeError.message : 'File write failed';
        results.push({
          name: file.name,
          size: file.size,
          status: 'error',
          message: errMsg
        });
        addUploadLog({
          fileName: finalName,
          fileSize: file.size,
          fileType: ext,
          uploadedBy: UPLOADED_BY,
          status: 'failed',
          remarks: errMsg
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