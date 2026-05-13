"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // When user selects file manually
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // When user drops file
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100">
      <main className="w-full max-w-xl p-10 bg-white rounded-xl shadow-md">

        {/* Instruction */}
        <h1 className="text-2xl font-bold mb-4">
          Upload Your File
        </h1>
        <p className="text-zinc-600 mb-6">
          Drag and drop your file below, or click to select a file.
        </p>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition
            ${isDragging ? "bg-blue-100 border-blue-500" : "border-zinc-300"}
          `}
        >
          <input
            type="file"
            onChange={handleChange}
            className="hidden"
            id="fileUpload"
          />

          <label htmlFor="fileUpload" className="cursor-pointer">
            <p className="text-lg">
              {isDragging ? "Drop file here..." : "Click or drag file here"}
            </p>
          </label>
        </div>

        {/* Show selected file */}
        {file && (
          <div className="mt-6 p-4 bg-green-100 rounded">
            <p className="text-sm">
              Selected file: <strong>{file.name}</strong>
            </p>
          </div>
        )}

      </main>
    </div>
  );
}