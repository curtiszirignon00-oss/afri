interface PulseDotProps {
  visible: boolean;
  className?: string;
}

export default function PulseDot({ visible, className = '' }: PulseDotProps) {
  if (!visible) return null;

  return (
    <>
      <span
        className={`absolute -top-1 -right-1 z-10 flex h-3 w-3 ${className}`}
      >
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{
            backgroundColor: '#00D4A8',
            animation: 'onboarding-ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
          }}
        />
        <span
          className="relative inline-flex h-3 w-3 rounded-full"
          style={{ backgroundColor: '#00D4A8' }}
        />
      </span>

      <style>{`
        @keyframes onboarding-ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </>
  );
}
