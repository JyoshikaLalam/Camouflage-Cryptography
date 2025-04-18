import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Image, Globe, Radio, Copy, Download, Upload } from 'lucide-react';
import {
  generateKey,
  encryptData,
  decryptData,
  generateImageDataUrl,
  parseImageDataUrl,
  type EncryptionType,
} from './utils/encryption';

function App() {
  const [inputText, setInputText] = useState('');
  const [encryptionType, setEncryptionType] = useState<EncryptionType>('stream');
  const [encryptedData, setEncryptedData] = useState('');
  const [decryptedData, setDecryptedData] = useState('');
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [iv, setIv] = useState('');
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [detectedType, setDetectedType] = useState<EncryptionType | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initKey = async () => {
      const newKey = await generateKey();
      setKey(newKey);
    };
    initKey();
  }, []);

  const handleEncrypt = async () => {
    if (!key || !inputText) return;

    try {
      const { encrypted, iv: newIv } = await encryptData(inputText, key, encryptionType);
      setEncryptedData(encrypted);
      setIv(newIv);
      setDetectedType(null);
      setDecryptedData('');
      setDecryptError(null);
    } catch (error) {
      console.error('Encryption failed:', error);
    }
  };

  const handleDecrypt = async () => {
    if (!key || !encryptedData || !iv) return;

    try {
      const { decrypted, type } = await decryptData(encryptedData, iv, key);
      setDecryptedData(decrypted);
      setDetectedType(type);
      setDecryptError(null);
    } catch (error) {
      console.error('Decryption failed:', error);
      setDecryptError((error as Error).message);
      setDecryptedData('');
      setDetectedType(null);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleDownloadImage = () => {
    if (!encryptedData || !encryptedData.startsWith('IMG')) return;

    const link = document.createElement('a');
    link.href = generateImageDataUrl(encryptedData);
    link.download = 'encrypted-data.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        const base64Data = await parseImageDataUrl(dataUrl);
        setEncryptedData(`IMG${base64Data}`);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to read image:', error);
    }
  };

  const getEncryptionIcon = (type: EncryptionType) => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'dns':
        return <Globe className="w-5 h-5" />;
      case 'stream':
        return <Radio className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Secure Encryption System</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Encryption Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Lock className="mr-2" /> Encryption
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Encryption Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['image', 'dns', 'stream'] as EncryptionType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setEncryptionType(type)}
                      className={`p-3 rounded-lg flex items-center justify-center capitalize ${
                        encryptionType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {getEncryptionIcon(type)}
                      <span className="ml-2">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Input Text</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-32 p-3 rounded-lg bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter text to encrypt..."
                />
              </div>

              <button
                onClick={handleEncrypt}
                disabled={!inputText || !key}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Encrypt
              </button>
            </div>
          </div>

          {/* Decryption Section */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Unlock className="mr-2" /> Decryption
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Encrypted Data</label>
                <div className="space-y-2">
                  <div className="relative">
                    <textarea
                      value={encryptedData}
                      onChange={(e) => setEncryptedData(e.target.value)}
                      className="w-full h-32 p-3 rounded-lg bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter encrypted data..."
                    />
                    <button
                      onClick={() => handleCopy(encryptedData)}
                      className="absolute top-2 right-2 p-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
                      title="Copy encrypted data"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors flex items-center"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      <span>Upload Image</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">IV (Initialization Vector)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={iv}
                    onChange={(e) => setIv(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter IV..."
                  />
                  <button
                    onClick={() => handleCopy(iv)}
                    className="absolute top-2 right-2 p-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
                    title="Copy IV"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleDecrypt}
                disabled={!encryptedData || !iv || !key}
                className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decrypt
              </button>

              {decryptError && (
                <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-300">
                  {decryptError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(encryptedData || decryptedData) && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Results</h2>
            
            <div className="space-y-4">
              {encryptedData && (
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <Lock className="w-4 h-4 mr-2" /> Encrypted Output
                    </div>
                    {encryptedData.startsWith('IMG') && (
                      <button
                        onClick={handleDownloadImage}
                        className="p-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors flex items-center"
                        title="Download as image"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        <span>Download Image</span>
                      </button>
                    )}
                  </h3>
                  <div className="space-y-4">
                    {encryptionType === 'image' ? (
                      <div className="bg-gray-700 p-3 rounded-lg">
                        <img
                          src={generateImageDataUrl(encryptedData)}
                          alt="Encrypted Data Visualization"
                          className="w-full object-contain rounded"
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-700 p-3 rounded-lg break-all relative">
                        {encryptedData}
                        <button
                          onClick={() => handleCopy(encryptedData)}
                          className="absolute top-2 right-2 p-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
                          title="Copy encrypted data"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {decryptedData && (
                <div>
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Unlock className="w-4 h-4 mr-2" /> Decrypted Output
                    {detectedType && (
                      <span className="ml-2 text-sm bg-blue-600 px-2 py-1 rounded-full flex items-center">
                        {getEncryptionIcon(detectedType)}
                        <span className="ml-1 capitalize">{detectedType}</span>
                      </span>
                    )}
                  </h3>
                  <div className="bg-gray-700 p-3 rounded-lg relative">
                    {decryptedData}
                    <button
                      onClick={() => handleCopy(decryptedData)}
                      className="absolute top-2 right-2 p-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
                      title="Copy decrypted data"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Copy Success Toast */}
        {copySuccess && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;