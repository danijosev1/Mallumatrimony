import React, { useState } from 'react';
import { Camera, Upload, X, Plus, Star, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExpoFeatures } from '../../hooks/useExpoFeatures';

interface ExpoPhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

const ExpoPhotoUpload: React.FC<ExpoPhotoUploadProps> = ({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 6 
}) => {
  const [uploading, setUploading] = useState(false);
  const { isNative, takePicture, pickImage, permissions, hapticFeedback } = useExpoFeatures();

  const handleTakePhoto = async () => {
    if (photos.length >= maxPhotos) {
      await hapticFeedback('heavy');
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    try {
      setUploading(true);
      await hapticFeedback('light');
      
      const photoUri = await takePicture();
      if (photoUri) {
        onPhotosChange([...photos, photoUri]);
        await hapticFeedback('medium');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      await hapticFeedback('heavy');
      alert('Failed to take photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePickImages = async () => {
    if (photos.length >= maxPhotos) {
      await hapticFeedback('heavy');
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    try {
      setUploading(true);
      await hapticFeedback('light');
      
      const imageUris = await pickImage();
      if (imageUris.length > 0) {
        const remainingSlots = maxPhotos - photos.length;
        const newPhotos = imageUris.slice(0, remainingSlots);
        onPhotosChange([...photos, ...newPhotos]);
        await hapticFeedback('medium');
      }
    } catch (error) {
      console.error('Error picking images:', error);
      await hapticFeedback('heavy');
      alert('Failed to select photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (index: number) => {
    await hapticFeedback('light');
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const setAsPrimary = async (index: number) => {
    if (index === 0) return;
    await hapticFeedback('medium');
    const newPhotos = [...photos];
    const [primaryPhoto] = newPhotos.splice(index, 1);
    newPhotos.unshift(primaryPhoto);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      {photos.length < maxPhotos && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Smartphone className="text-primary" size={24} />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-primary mb-2">Add Your Photos</h3>
              <p className="text-text/70 mb-4 text-sm">
                Upload up to {maxPhotos} photos. The first photo will be your profile picture.
              </p>
              
              <div className="space-y-3">
                {/* Camera button */}
                {isNative && permissions.camera && (
                  <button
                    type="button"
                    onClick={handleTakePhoto}
                    disabled={uploading}
                    className="w-full btn-primary flex items-center justify-center"
                  >
                    <Camera size={18} className="mr-2" />
                    {uploading ? 'Taking Photo...' : 'Take Photo'}
                  </button>
                )}
                
                {/* Gallery picker */}
                <button
                  type="button"
                  onClick={handlePickImages}
                  disabled={uploading}
                  className="w-full btn-outline flex items-center justify-center"
                >
                  <Upload size={18} className="mr-2" />
                  {uploading ? 'Selecting...' : 'Choose from Gallery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-primary">Your Photos ({photos.length}/{maxPhotos})</h3>
            <div className="text-xs text-text/70">
              Tap to reorder
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {photos.map((photo, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary Photo Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                      <Star size={10} className="mr-1" />
                      Main
                    </div>
                  )}
                  
                  {/* Photo Number */}
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex flex-col space-y-2">
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
                          Set as Main
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removePhoto(index);
                        }}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors duration-200 mx-auto"
                      >
                        <X size={12} />
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
                onClick={isNative && permissions.camera ? handleTakePhoto : handlePickImages}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-text/70 hover:border-primary hover:text-primary transition-all duration-300 active:scale-95"
              >
                <Plus size={20} className="mb-1" />
                <span className="text-xs">Add Photo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Photo guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
          <Camera size={16} className="mr-2" />
          📱 Photo Tips
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use good lighting - natural light works best</li>
          <li>• Include both close-up and full-body shots</li>
          <li>• Smile naturally and look at the camera</li>
          <li>• Avoid group photos or sunglasses</li>
          <li>• Your first photo will be your main profile picture</li>
        </ul>
      </div>
    </div>
  );
};

export default ExpoPhotoUpload;