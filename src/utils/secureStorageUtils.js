/**
 * Task 73: Build secure file storage system
 * File encryption and secure storage utilities
 */

export class SecureFileStorage {
  /**
   * Encrypt file before upload
   */
  static async encryptFile(file, password) {
    try {
      const data = await file.arrayBuffer();
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      
      // Generate key from password
      const key = await window.crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const derivedKey = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        key,
        256
      );

      // Encrypt data
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        derivedKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const encryptedData = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        data
      );

      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      combined.set(salt);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

      return new File([combined], file.name, { type: 'application/octet-stream' });
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt file after download
   */
  static async decryptFile(encryptedFile, password) {
    try {
      const encryptedData = await encryptedFile.arrayBuffer();
      const encryptedArray = new Uint8Array(encryptedData);

      const salt = encryptedArray.slice(0, 16);
      const iv = encryptedArray.slice(16, 28);
      const data = encryptedArray.slice(28);

      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);

      const key = await window.crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedKey = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        key,
        256
      );

      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        derivedKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decryptedData = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        cryptoKey,
        data
      );

      return new File([decryptedData], encryptedFile.name);
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  /**
   * Generate secure file access token
   */
  static generateAccessToken(fileId, expiresIn = 3600) {
    const token = {
      fileId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + expiresIn * 1000,
      nonce: Math.random().toString(36).substring(7)
    };
    return btoa(JSON.stringify(token));
  }

  /**
   * Verify file access token
   */
  static verifyAccessToken(token) {
    try {
      const decoded = JSON.parse(atob(token));
      if (Date.now() > decoded.expiresAt) {
        return { valid: false, reason: 'Token expired' };
      }
      return { valid: true, fileId: decoded.fileId };
    } catch (error) {
      return { valid: false, reason: 'Invalid token' };
    }
  }
}

/**
 * Task 74: Create backup and restore workflows
 */
export class BackupRestore {
  /**
   * Create full backup of user data
   */
  static async createBackup(db, userId) {
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      
      const collections = ['users', 'orders', 'appointments', 'documents'];
      const backup = {
        userId,
        timestamp: new Date().toISOString(),
        data: {}
      };

      for (const coll of collections) {
        const q = query(collection(db, coll), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        backup.data[coll] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      return backup;
    } catch (error) {
      console.error('Backup error:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  static async restoreBackup(db, backup) {
    try {
      const { collection, addDoc } = await import('firebase/firestore');

      for (const [collName, docs] of Object.entries(backup.data)) {
        for (const docData of docs) {
          const { id, ...data } = docData;
          await addDoc(collection(db, collName), data);
        }
      }

      return { success: true, restored: backup };
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    }
  }

  /**
   * Export backup as JSON file
   */
  static exportBackupAsJSON(backup) {
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_${backup.userId}_${new Date().getTime()}.json`;
    link.click();
  }
}

export default SecureFileStorage;
