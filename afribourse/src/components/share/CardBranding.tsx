// src/components/share/CardBranding.tsx
// Uses a pre-generated static QR code image (no dynamic generation per render)

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
                    <p className="text-[10px] text-gray-500 leading-tight">africbourse.com</p>
                </div>
            </div>

            {/* QR Code - static pre-generated image */}
            <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-400 max-w-[80px] text-right leading-tight">
                    Scannez pour investir
                </p>
                <img
                    src="/images/qr-africbourse.svg"
                    alt="QR Code africbourse.com"
                    className="w-12 h-12"
                />
            </div>
        </div>
    );
}
