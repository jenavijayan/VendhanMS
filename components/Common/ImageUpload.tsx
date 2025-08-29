import React, { useState, ChangeEvent, useRef } from 'react';
import { PhotoIcon, XCircleIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { THEME } from '../../constants';

interface ImageUploadProps {
  onImageSelected: (base64: string | null) => void;
  currentImageUrl?: string | null;
  label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageSelected, 
  currentImageUrl, 
  label = "Upload Image" 
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File is too large. Please select an image under 2MB.");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        alert("Invalid file type. Please select a JPG, PNG, GIF, or WEBP image.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewUrl(base64String);
        onImageSelected(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className={`block text-sm font-medium text-${THEME.accentText}`}>{label}</label>
      <div className={`mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md`}>
        <div className="space-y-1 text-center">
          {previewUrl ? (
            <div className="relative group">
              <img src={previewUrl} alt="Preview" className="mx-auto h-24 w-24 rounded-full object-cover shadow-md" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <PhotoIcon className={`mx-auto h-12 w-12 text-gray-400`} />
          )}
          
          <div className="flex text-sm text-gray-600 justify-center">
            <button
              type="button"
              onClick={triggerFileInput}
              className={`relative cursor-pointer bg-white rounded-md font-medium text-${THEME.secondary} hover:text-opacity-80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-${THEME.secondary}`}
            >
              <span>{previewUrl ? 'Change image' : 'Select an image'}</span>
              <input 
                ref={fileInputRef} 
                id="file-upload" 
                name="file-upload" 
                type="file" 
                className="sr-only" 
                onChange={handleFileChange}
                accept="image/jpeg, image/png, image/gif, image/webp"
              />
            </button>
          </div>
          {!previewUrl && <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 2MB</p>}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
