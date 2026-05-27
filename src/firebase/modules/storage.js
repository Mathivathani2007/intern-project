import { storage } from '../firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Reusable Storage module (Task 79)
 */

export const StorageModule = {
  uploadFile: (path, file, onProgress) => {
    const ref = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(ref, file);
    uploadTask.on('state_changed', (snapshot) => {
      const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      if (onProgress) onProgress(percent);
    });
    return uploadTask.then(() => getDownloadURL(ref));
  },
  getDownloadURL: (path) => getDownloadURL(storageRef(storage, path))
};

export default StorageModule;
