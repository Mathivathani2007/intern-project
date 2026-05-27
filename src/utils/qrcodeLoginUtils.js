import QRCode from 'qrcode';

/**
 * Task 53: Create QR code-based login
 * Generate and verify QR codes for secure login
 */

export class QRCodeLogin {
  /**
   * Generate QR code for user login
   */
  static async generateLoginQR(userId, expiresIn = 300) {
    try {
      const expiryTime = Date.now() + expiresIn * 1000;
      const qrData = {
        userId,
        timestamp: Date.now(),
        expiresAt: expiryTime,
        type: 'LOGIN'
      };

      const qrString = JSON.stringify(qrData);
      const qrCanvas = await QRCode.toCanvas(qrString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300
      });

      return {
        canvas: qrCanvas,
        qrData,
        expiresAt: expiryTime
      };
    } catch (error) {
      console.error('QR generation error:', error);
      throw error;
    }
  }

  /**
   * Verify QR code validity
   */
  static verifyQRCode(qrData) {
    try {
      const parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;

      if (!parsed.userId || !parsed.expiresAt) {
        return { valid: false, reason: 'Invalid QR data' };
      }

      if (Date.now() > parsed.expiresAt) {
        return { valid: false, reason: 'QR code expired' };
      }

      if (parsed.type !== 'LOGIN') {
        return { valid: false, reason: 'Invalid QR type' };
      }

      return { valid: true, userId: parsed.userId };
    } catch (error) {
      return { valid: false, reason: 'QR parsing failed' };
    }
  }

  /**
   * Generate device pairing QR
   */
  static async generateDevicePairingQR(deviceId, secret) {
    try {
      const pairingData = JSON.stringify({
        deviceId,
        secret,
        timestamp: Date.now(),
        type: 'DEVICE_PAIR'
      });

      const qrCanvas = await QRCode.toCanvas(pairingData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 250
      });

      return qrCanvas;
    } catch (error) {
      console.error('Device pairing QR error:', error);
      throw error;
    }
  }
}

export default QRCodeLogin;
