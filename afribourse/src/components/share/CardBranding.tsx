// src/components/share/CardBranding.tsx
import { QRCodeSVG } from 'qrcode.react';

const SITE_URL = 'https://afribourse.com';

export default function CardBranding() {
    return (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/60">
            {/* Logo + Brand */}
            <div className="flex items-center gap-2">
                <img
                    src="/images/logo_afribourse.png"
                    alt="AfriBourse"
                    className="w-8 h-8 object-contain"
                />
                <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">AfriBourse</p>
                    <p className="text-[10px] text-gray-500 leading-tight">afribourse.com</p>
                </div>
            </div>

            {/* QR Code */}
            <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-400 max-w-[80px] text-right leading-tight">
                    Scannez pour investir
                </p>
                <QRCodeSVG
                    value={SITE_URL}
                    size={48}
                    bgColor="transparent"
                    fgColor="#1e40af"
                    level="M"
                    includeMargin={false}
                />
            </div>
        </div>
    );
}
