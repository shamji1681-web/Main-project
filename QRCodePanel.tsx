import React, { useState, useCallback } from 'react';
import { FabricImage } from 'fabric';
import { useEditorStore } from '../../store/editorStore';
import { v4 as uuid } from 'uuid';

type QRType = 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'vcard';

const QRCodePanel: React.FC = () => {
  const { canvas, canvasSize, saveToHistory } = useEditorStore();
  const [qrType, setQRType] = useState<QRType>('url');
  const [qrValue, setQRValue] = useState('https://');
  const [qrSize, setQrSize] = useState(200);
  const [qrColor, setQrColor] = useState('#000000');
  const [qrBg, setQrBg] = useState('#ffffff');

  // vCard fields
  const [vcName, setVcName] = useState('');
  const [vcPhone, setVcPhone] = useState('');
  const [vcEmail, setVcEmail] = useState('');
  const [vcCompany, setVcCompany] = useState('');

  // WiFi fields
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiEnc, setWifiEnc] = useState('WPA');

  const getQRData = useCallback(() => {
    switch (qrType) {
      case 'url': return qrValue;
      case 'text': return qrValue;
      case 'email': return `mailto:${qrValue}`;
      case 'phone': return `tel:${qrValue}`;
      case 'wifi': return `WIFI:T:${wifiEnc};S:${wifiSSID};P:${wifiPass};;`;
      case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcName}\nTEL:${vcPhone}\nEMAIL:${vcEmail}\nORG:${vcCompany}\nEND:VCARD`;
      default: return qrValue;
    }
  }, [qrType, qrValue, wifiSSID, wifiPass, wifiEnc, vcName, vcPhone, vcEmail, vcCompany]);

  const generateQR = useCallback(() => {
    if (!canvas) return;
    const data = encodeURIComponent(getQRData());
    const color = qrColor.replace('#', '');
    const bg = qrBg.replace('#', '');
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${data}&size=${qrSize}x${qrSize}&color=${color}&bgcolor=${bg}&format=png`;

    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = () => {
      const fabricImg = new FabricImage(imgEl, {
        left: canvasSize.width / 2,
        top: canvasSize.height / 2,
        originX: 'center',
        originY: 'center',
      });
      (fabricImg as any).id = uuid();
      (fabricImg as any).name = 'QR Code';
      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.renderAll();
      saveToHistory();
    };
    imgEl.src = url;
  }, [canvas, canvasSize, getQRData, qrSize, qrColor, qrBg, saveToHistory]);

  const types: { id: QRType; label: string; icon: string }[] = [
    { id: 'url', label: 'URL', icon: '🌐' },
    { id: 'text', label: 'Text', icon: '📝' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'phone', label: 'Phone', icon: '📱' },
    { id: 'wifi', label: 'WiFi', icon: '📶' },
    { id: 'vcard', label: 'vCard', icon: '👤' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-white font-semibold text-lg">QR Code</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* QR Type */}
        <div className="grid grid-cols-3 gap-2">
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setQRType(t.id)}
              className={`py-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                qrType === t.id ? 'bg-purple-600 text-white' : 'bg-[#1e1e3a] text-gray-400 hover:bg-[#2a2a5a]'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Input based on type */}
        {(qrType === 'url' || qrType === 'text') && (
          <div>
            <label className="text-gray-400 text-xs font-semibold block mb-1.5">
              {qrType === 'url' ? 'Enter URL' : 'Enter Text'}
            </label>
            <textarea
              value={qrValue}
              onChange={(e) => setQRValue(e.target.value)}
              className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              rows={3}
              placeholder={qrType === 'url' ? 'https://example.com' : 'Enter your text...'}
            />
          </div>
        )}

        {qrType === 'email' && (
          <div>
            <label className="text-gray-400 text-xs font-semibold block mb-1.5">Email Address</label>
            <input type="email" value={qrValue} onChange={(e) => setQRValue(e.target.value)}
              className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="name@example.com" />
          </div>
        )}

        {qrType === 'phone' && (
          <div>
            <label className="text-gray-400 text-xs font-semibold block mb-1.5">Phone Number</label>
            <input type="tel" value={qrValue} onChange={(e) => setQRValue(e.target.value)}
              className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="+1 555 123 4567" />
          </div>
        )}

        {qrType === 'wifi' && (
          <div className="space-y-2">
            <div>
              <label className="text-gray-400 text-xs font-semibold block mb-1">Network Name (SSID)</label>
              <input value={wifiSSID} onChange={(e) => setWifiSSID(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="MyWiFi" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold block mb-1">Password</label>
              <input value={wifiPass} onChange={(e) => setWifiPass(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="password123" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold block mb-1">Encryption</label>
              <select value={wifiEnc} onChange={(e) => setWifiEnc(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </div>
          </div>
        )}

        {qrType === 'vcard' && (
          <div className="space-y-2">
            <div>
              <label className="text-gray-400 text-xs font-semibold block mb-1">Full Name</label>
              <input value={vcName} onChange={(e) => setVcName(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="John Doe" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold block mb-1">Phone</label>
              <input value={vcPhone} onChange={(e) => setVcPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="+1 555 123 4567" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold block mb-1">Email</label>
              <input value={vcEmail} onChange={(e) => setVcEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="john@company.com" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-semibold block mb-1">Company</label>
              <input value={vcCompany} onChange={(e) => setVcCompany(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e1e3a] border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                placeholder="Company Inc." />
            </div>
          </div>
        )}

        {/* Size & Colors */}
        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs font-semibold block mb-1">Size: {qrSize}px</label>
            <input type="range" min={100} max={600} value={qrSize} onChange={(e) => setQrSize(parseInt(e.target.value))} className="w-full" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-gray-400 text-xs font-semibold block mb-1">QR Color</label>
              <input type="color" value={qrColor} onChange={(e) => setQrColor(e.target.value)}
                className="w-full h-8 rounded cursor-pointer border-0 bg-transparent" />
            </div>
            <div className="flex-1">
              <label className="text-gray-400 text-xs font-semibold block mb-1">Background</label>
              <input type="color" value={qrBg} onChange={(e) => setQrBg(e.target.value)}
                className="w-full h-8 rounded cursor-pointer border-0 bg-transparent" />
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateQR}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <span className="text-lg">📱</span> Generate QR Code
        </button>

        {/* Preview */}
        <div className="bg-[#1e1e3a] rounded-lg p-4 flex items-center justify-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(getQRData() || 'https://example.com')}&size=150x150&color=${qrColor.replace('#','')}&bgcolor=${qrBg.replace('#','')}`}
            alt="QR Preview"
            className="rounded"
            style={{ maxWidth: 150 }}
          />
        </div>
      </div>
    </div>
  );
};

export default QRCodePanel;
