/**
 * Task 52: Implement image compression utility
 * Compresses images before upload to reduce storage costs
 */

export class ImageCompression {
  /**
   * Compress image file
   */
  static async compressImage(file, options = {}) {
    const {
      maxWidth = 1920,
      maxHeight = 1440,
      quality = 0.8,
      mimeType = 'image/jpeg'
    } = options;

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            },
            mimeType,
            quality
          );
        };

        img.src = event.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Compress multiple images
   */
  static async compressMultiple(files, options = {}) {
    const promises = Array.from(files).map(file => 
      this.compressImage(file, options)
    );
    return Promise.all(promises);
  }

  /**
   * Get file size info before and after compression
   */
  static getCompressionStats(originalSize, compressedSize) {
    return {
      originalSize: (originalSize / 1024 / 1024).toFixed(2) + ' MB',
      compressedSize: (compressedSize / 1024 / 1024).toFixed(2) + ' MB',
      reductionPercent: ((1 - compressedSize / originalSize) * 100).toFixed(2) + '%'
    };
  }
}
