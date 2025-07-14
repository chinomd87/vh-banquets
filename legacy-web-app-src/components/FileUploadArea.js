import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Upload, File, FileText, FileType, Image, Trash2, Download, Eye, Brain } from 'lucide-react';
import { uploadEventFile, validateFile, formatFileSize, getFileIcon } from '../utils/fileUpload';
import { useStorage, useDb, useAuth } from '../contexts/AppContext';
import { PDFAnalysisPanel } from './PDFAnalysisPanel';

export function FileUploadArea({ eventId, files = [], onFilesChange, onPDFAnalyzed, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(new Map());
  const [selectedPDF, setSelectedPDF] = useState(null);
  const fileInputRef = useRef(null);
  const storage = useStorage();
  const db = useDb();
  const { user } = useAuth();

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = async (filesToUpload) => {
    if (!eventId || !storage || !db || !user) {
      console.error('Missing required dependencies for file upload');
      return;
    }

    for (const file of filesToUpload) {
      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        console.error(`File ${file.name}: ${validation.error}`);
        continue;
      }

      // Track upload progress
      const uploadId = Date.now() + Math.random();
      
      try {
        setUploadingFiles(prev => new Map(prev).set(uploadId, {
          fileName: file.name,
          progress: 0
        }));

        // Upload file
        const uploadedFile = await uploadEventFile(
          file,
          eventId,
          storage,
          db,
          user.uid,
          (progress) => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              const fileData = newMap.get(uploadId);
              if (fileData) {
                newMap.set(uploadId, { ...fileData, progress });
              }
              return newMap;
            });
          }
        );

        // Remove from uploading list
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });

        // Add to files list
        if (onFilesChange) {
          onFilesChange([...files, uploadedFile]);
        }

      } catch (error) {
        console.error('Upload failed:', error);
        // Remove from uploading list on error
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
      }
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getIconComponent = (iconName) => {
    const icons = {
      FileText,
      FileType,
      Image,
      File
    };
    return icons[iconName] || File;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <button
        type="button"
        disabled={disabled}
        className={`
          relative w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          PDF, DOC, DOCX, TXT, JPG, PNG up to 10MB
        </p>
      </button>

      {/* Uploading Files */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploading...</h4>
          {Array.from(uploadingFiles.entries()).map(([id, { fileName, progress }]) => (
            <div key={id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 truncate">{fileName}</span>
                <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
          <div className="space-y-2">
            {files.map((file) => {
              const IconComponent = getIconComponent(getFileIcon(file.fileExtension));
              
              return (
                <div key={file.id} className="bg-white border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <IconComponent className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalName || file.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.fileSize)} • {file.fileExtension?.toUpperCase()}
                          {file.uploadedAt && (
                            <span> • {new Date(file.uploadedAt.seconds * 1000).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {/* Analyze PDF button for PDF files */}
                      {file.fileExtension?.toLowerCase() === 'pdf' && (
                        <button
                          onClick={async () => {
                            try {
                              // Create a File object from the download URL
                              const response = await fetch(file.downloadURL);
                              const blob = await response.blob();
                              const fileObj = new File([blob], file.originalName || file.fileName, {
                                type: 'application/pdf'
                              });
                              setSelectedPDF(fileObj);
                            } catch (error) {
                              console.error('Error preparing PDF for analysis:', error);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Analyze PDF content"
                        >
                          <Brain className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => window.open(file.downloadURL, '_blank')}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View file"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = file.downloadURL;
                          link.download = file.originalName || file.fileName;
                          link.click();
                        }}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {!disabled && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${file.originalName || file.fileName}"?`)) {
                              // Handle file deletion
                              if (onFilesChange) {
                                const updatedFiles = files.filter(f => f.id !== file.id);
                                onFilesChange(updatedFiles);
                              }
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PDF Analysis Panel */}
      {selectedPDF && (
        <PDFAnalysisPanel
          file={selectedPDF}
          onExtractedData={onPDFAnalyzed}
          onClose={() => setSelectedPDF(null)}
        />
      )}
    </div>
  );
}

FileUploadArea.propTypes = {
  eventId: PropTypes.string.isRequired,
  files: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    originalName: PropTypes.string,
    fileName: PropTypes.string,
    fileSize: PropTypes.number,
    fileExtension: PropTypes.string,
    downloadURL: PropTypes.string,
    uploadedAt: PropTypes.object
  })),
  onFilesChange: PropTypes.func.isRequired,
  onPDFAnalyzed: PropTypes.func,
  disabled: PropTypes.bool
};

export default FileUploadArea;
