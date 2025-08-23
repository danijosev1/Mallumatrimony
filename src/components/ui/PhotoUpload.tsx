import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Plus, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';
import { useExpoFeatures } from '../../hooks/useExpoFeatures';
import MobilePhotoUpload from '../mobile/MobilePhotoUpload';
import ExpoPhotoUpload from '../mobile/ExpoPhotoUpload';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 6 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { isNative } = useMobileFeatures();
  const { isNative: isExpoNative } = useExpoFeatures();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use Expo component for Expo apps, or mobile component for other native apps
  if (isExpoNative) {
    return (
      <ExpoPhotoUpload 
        photos={photos} 
        onPhotosChange={onPhotosChange} 
        maxPhotos={maxPhotos} 
      />
    );
  } else if (isNative) {
    return (
      <MobilePhotoUpload 
        photos={photos} 
        onPhotosChange={onPhotosChange} 
        maxPhotos={maxPhotos} 
      />
    );
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: string[] = [];
    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPhotos.push(e.target.result as string);
            if (newPhotos.length === filesToProcess) {
              onPhotosChange([...photos, ...newPhotos]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    onPhotosChange(newPhotos);
  };

  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    const newPhotos = [...photos];
    const [primaryPhoto] = newPhotos.splice(index, 1);
    newPhotos.unshift(primaryPhoto);
    onPhotosChange(newPhotos);
  };

  const handleChoosePhotosClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Camera className="text-primary" size={24} />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-primary mb-2">Add Your Photos</h3>
              <p className="text-text/70 mb-4">
                Upload up to {maxPhotos} photos. The first photo will be your profile picture.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleChoosePhotosClick}
                  className="btn-primary flex items-center justify-center"
                >
                  <Upload size={18} className="mr-2" />
                  Choose Photos
                </button>
                
                <div className="text-sm text-text/60 flex items-center justify-center">
                  or drag and drop photos here
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-primary">Your Photos ({photos.length}/{maxPhotos})</h3>
            <div className="text-sm text-text/70">
              Drag to reorder • First photo is your profile picture
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence>
              {photos.map((photo, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-move"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    if (fromIndex !== index) {
                      movePhoto(fromIndex, index);
                    }
                  }}
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary Photo Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                      <Star size={12} className="mr-1" />
                      Profile Picture
                    </div>
                  )}
                  
                  {/* Photo Number */}
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex space-x-2">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAsPrimary(index);
                          }}
                          className="bg-white text-primary px-3 py-1 rounded-full text-xs font-medium hover:bg-gray-100 transition-colors duration-200"
                        >
                          Set as Primary
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removePhoto(index);
                        }}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Add More Button */}
            {photos.length < maxPhotos && (
              <button
                type="button"
                onClick={handleChoosePhotosClick}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-text/70 hover:border-primary hover:text-primary transition-all duration-300"
              >
                <Plus size={24} className="mb-2" />
                <span className="text-sm">Add Photo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Photo Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">📋 Photo Guidelines</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use clear, recent photos that show your face clearly</li>
          <li>• Include a mix of close-up and full-body photos</li>
          <li>• Avoid group photos or photos with sunglasses</li>
          <li>• Make sure photos are well-lit and high quality</li>
          <li>• Your first photo will be your main profile picture</li>
        </ul>
      </div>
    </div>
  );
};

export default PhotoUpload;