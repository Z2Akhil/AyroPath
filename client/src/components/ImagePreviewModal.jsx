/* ImagePreviewModal.jsx */
import React from 'react';

const ImagePreviewModal = ({ pkg, onClose }) => {
  if (!pkg) return null;

  const imgSrc =
    pkg.imageLocation ||
    pkg.imageMaster?.[0]?.imgLocations ||
    '/packagePic.png';

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg p-2 max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close icon */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70"
        >
          ✕
        </button>

        <img
          src={imgSrc}
          loading='lazy'
          alt={pkg.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/packagePic.png';
          }}
          className="w-full h-auto max-h-[80vh] object-contain rounded"
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal;