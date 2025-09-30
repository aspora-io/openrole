'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadWidgetProps {
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (fileId: string) => Promise<void>;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  uploadedFiles?: UploadedFile[];
  uploadType?: 'CV' | 'PORTFOLIO' | 'PROFILE_PHOTO' | 'CERTIFICATE';
  label?: string;
  description?: string;
  readonly?: boolean;
}

interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  isDefault?: boolean;
  label?: string;
  uploadType?: string;
}

const fileTypeConfigs = {
  CV: {
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    icon: '📄',
    description: 'Upload PDF, DOC, or DOCX files up to 5MB'
  },
  PORTFOLIO: {
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    icon: '🎨',
    description: 'Upload images, PDFs, or presentations up to 20MB'
  },
  PROFILE_PHOTO: {
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    icon: '📸',
    description: 'Upload PNG, JPG, JPEG, or WebP images up to 5MB'
  },
  CERTIFICATE: {
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    icon: '🏆',
    description: 'Upload PDF or image files up to 10MB'
  }
};

export default function FileUploadWidget({
  onUpload,
  onDelete,
  acceptedFileTypes,
  maxFileSize,
  maxFiles = 10,
  uploadedFiles = [],
  uploadType = 'PORTFOLIO',
  label,
  description,
  readonly = false
}: FileUploadWidgetProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [uploadErrors, setUploadErrors] = useState<Map<string, string>>(new Map());

  const config = fileTypeConfigs[uploadType];
  const accept = acceptedFileTypes ? undefined : config.accept;
  const maxSize = maxFileSize || config.maxSize;

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const newErrors = new Map(uploadErrors);
      rejectedFiles.forEach((file) => {
        const error = file.errors[0];
        let message = 'File upload failed';
        if (error.code === 'file-too-large') {
          message = `File is too large. Maximum size is ${formatFileSize(maxSize)}`;
        } else if (error.code === 'file-invalid-type') {
          message = 'File type not supported';
        } else if (error.code === 'too-many-files') {
          message = `Maximum ${maxFiles} files allowed`;
        }
        newErrors.set(file.file.name, message);
      });
      setUploadErrors(newErrors);
      return;
    }

    // Clear previous errors
    setUploadErrors(new Map());

    // Check total file count
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      const newErrors = new Map();
      newErrors.set('_global', `You can only upload ${maxFiles} files. Currently have ${uploadedFiles.length}.`);
      setUploadErrors(newErrors);
      return;
    }

    // Upload accepted files
    if (onUpload && acceptedFiles.length > 0) {
      // Initialize progress tracking
      const newUploadingFiles = new Map(uploadingFiles);
      acceptedFiles.forEach((file) => {
        newUploadingFiles.set(file.name, 0);
      });
      setUploadingFiles(newUploadingFiles);

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadingFiles((current) => {
            const updated = new Map(current);
            acceptedFiles.forEach((file) => {
              const currentProgress = updated.get(file.name) || 0;
              if (currentProgress < 90) {
                updated.set(file.name, currentProgress + 10);
              }
            });
            return updated;
          });
        }, 200);

        await onUpload(acceptedFiles);

        // Complete progress and cleanup
        clearInterval(progressInterval);
        setUploadingFiles((current) => {
          const updated = new Map(current);
          acceptedFiles.forEach((file) => {
            updated.delete(file.name);
          });
          return updated;
        });
      } catch (error) {
        console.error('Upload error:', error);
        setUploadErrors(new Map([['_global', 'Upload failed. Please try again.']]));
        setUploadingFiles(new Map());
      }
    }
  }, [onUpload, uploadedFiles.length, maxFiles, maxSize, uploadErrors, uploadingFiles]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject
  } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: readonly || uploadedFiles.length >= maxFiles
  });

  const handleDelete = async (fileId: string) => {
    if (!onDelete || !window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await onDelete(fileId);
    } catch (error) {
      console.error('Delete error:', error);
      setUploadErrors(new Map([['_global', 'Failed to delete file']]));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!readonly && uploadedFiles.length < maxFiles && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label || `Upload ${uploadType.replace('_', ' ').toLowerCase()}`}
          </label>
          
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isDragReject ? 'border-red-400 bg-red-50' : ''}
              ${uploadedFiles.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="text-4xl mb-4">{config.icon}</div>
            
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop the files here...</p>
            ) : isDragReject ? (
              <p className="text-red-600 font-medium">Some files will be rejected</p>
            ) : (
              <>
                <p className="text-gray-900 font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-600">
                  {description || config.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {uploadedFiles.length}/{maxFiles} files uploaded
                </p>
              </>
            )}
          </div>

          {/* Global Errors */}
          {uploadErrors.has('_global') && (
            <p className="mt-2 text-sm text-red-600">{uploadErrors.get('_global')}</p>
          )}
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploading...</h4>
          {Array.from(uploadingFiles.entries()).map(([fileName, progress]) => (
            <div key={fileName} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {fileName}
                </span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.label || file.fileName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                  {file.isDefault && (
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Default
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <a
                  href={file.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  View
                </a>
                {!readonly && onDelete && (
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* File-specific Errors */}
          {Array.from(uploadErrors.entries())
            .filter(([key]) => key !== '_global')
            .map(([fileName, error]) => (
              <div key={fileName} className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">
                  <span className="font-medium">{fileName}:</span> {error}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {uploadedFiles.length === 0 && !uploadingFiles.size && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">{config.icon}</div>
          <p className="text-sm">
            {readonly ? 'No files uploaded yet' : 'No files uploaded. Drop files here to get started.'}
          </p>
        </div>
      )}

      {/* Storage Quota Warning */}
      {uploadedFiles.length >= maxFiles - 2 && uploadedFiles.length < maxFiles && !readonly && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ You're approaching the file limit. {maxFiles - uploadedFiles.length} uploads remaining.
          </p>
        </div>
      )}
    </div>
  );
}