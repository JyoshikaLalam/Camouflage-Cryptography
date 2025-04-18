import { Buffer } from 'buffer';

export type EncryptionType = 'image' | 'dns' | 'stream';

// Generate a random encryption key
export const generateKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

// Convert ArrayBuffer to Base64 string
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  return Buffer.from(buffer).toString('base64');
};

// Convert Base64 string to ArrayBuffer
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  return Buffer.from(base64, 'base64');
};

// Generate rainbow gradient
const createRainbowGradient = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, 'rgb(148,0,211)');   // Violet
  gradient.addColorStop(0.15, 'rgb(75,0,130)'); // Indigo
  gradient.addColorStop(0.3, 'rgb(0,0,255)');   // Blue
  gradient.addColorStop(0.45, 'rgb(0,255,0)');  // Green
  gradient.addColorStop(0.6, 'rgb(255,255,0)'); // Yellow
  gradient.addColorStop(0.75, 'rgb(255,127,0)');// Orange
  gradient.addColorStop(0.9, 'rgb(255,0,0)');   // Red
  return gradient;
};

// Generate image data URL from encrypted data
export const generateImageDataUrl = (encryptedData: string): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Set canvas size
  canvas.width = 800;
  canvas.height = 200;
  
  // Create rainbow gradient background
  const gradient = createRainbowGradient(ctx, canvas.width, canvas.height);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add some visual noise based on the encrypted data
  const dataArray = Array.from(encryptedData).map(char => char.charCodeAt(0));
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  
  for (let i = 0; i < data.length; i += 4) {
    const noiseValue = dataArray[i % dataArray.length] % 30 - 15;
    data[i] = Math.max(0, Math.min(255, data[i] + noiseValue));     // R
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noiseValue)); // G
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noiseValue)); // B
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

// Parse image data URL
export const parseImageDataUrl = async (dataUrl: string): Promise<string> => {
  try {
    // Create an image element to load the data URL
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    // Draw the image to a canvas to extract data
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Convert pixel data to base64
    return arrayBufferToBase64(pixels.buffer);
  } catch (error) {
    console.error('Failed to parse image:', error);
    throw new Error('Invalid image data');
  }
};

// Encrypt data
export const encryptData = async (
  data: string,
  key: CryptoKey,
  type: EncryptionType
): Promise<{ encrypted: string; iv: string }> => {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedData
  );

  let finalEncrypted = arrayBufferToBase64(encryptedData);

  // Apply additional encoding based on type
  switch (type) {
    case 'image':
      finalEncrypted = `IMG${finalEncrypted}`; // Add prefix for image type
      break;
    case 'dns':
      finalEncrypted = `DNS${finalEncrypted}`; // Add prefix for DNS type
      break;
    case 'stream':
      finalEncrypted = `STR${finalEncrypted}`; // Add prefix for stream type
      break;
  }

  return {
    encrypted: finalEncrypted,
    iv: arrayBufferToBase64(iv),
  };
};

// Decrypt data
export const decryptData = async (
  encryptedData: string,
  iv: string,
  key: CryptoKey
): Promise<{ decrypted: string; type: EncryptionType }> => {
  try {
    // Detect encryption type from prefix
    let type: EncryptionType = 'stream';
    let cleanData = encryptedData;

    if (encryptedData.startsWith('IMG')) {
      type = 'image';
      cleanData = encryptedData.slice(3);
    } else if (encryptedData.startsWith('DNS')) {
      type = 'dns';
      cleanData = encryptedData.slice(3);
    } else if (encryptedData.startsWith('STR')) {
      type = 'stream';
      cleanData = encryptedData.slice(3);
    }

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToArrayBuffer(iv),
      },
      key,
      base64ToArrayBuffer(cleanData)
    );

    const decoder = new TextDecoder();
    return {
      decrypted: decoder.decode(decryptedData),
      type,
    };
  } catch (error) {
    throw new Error('Unable to decrypt data. Please check your encrypted data and IV.');
  }
};