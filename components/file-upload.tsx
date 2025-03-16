'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export function FileUpload({ onFileSelect, isUploading = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file (JPEG/PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 ${
          dragActive ? 'border-primary' : 'border-muted-foreground/25'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          id="file-upload"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleChange}
          disabled={isUploading}
        />
        <Label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center gap-2 cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              Drag and drop your invoice here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports PDF, JPEG, and PNG (max 10MB)
            </p>
          </div>
          <Button
            variant="secondary"
            className="mt-4"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Select File'}
          </Button>
        </Label>
      </div>
    </div>
  );
} 