import { useState, ChangeEvent } from 'react';

export function useImageUpload(maxFiles = 5) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    // Convert FileList to an array
    const fileArray = Array.from(files);
    
    // Limit the number of files
    const allowedFiles = fileArray.slice(0, maxFiles - selectedFiles.length);
    
    // Update selected files
    setSelectedFiles(prevFiles => [...prevFiles, ...allowedFiles]);
    
    // Generate preview URLs
    const newPreviewUrls = allowedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
    
    // Reset the input
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    // Remove file and preview URL
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  };

  const resetFiles = () => {
    // Revoke all object URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Clear files and preview URLs
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  return {
    selectedFiles,
    previewUrls,
    handleFileChange,
    handleRemoveFile,
    resetFiles
  };
}
