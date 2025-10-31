// src/components/ui/ErrorMessage.tsx
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export default function ErrorMessage({
  title = 'Une erreur est survenue',
  message,
  onRetry,
  fullScreen = false,
}: ErrorMessageProps) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      {content}
    </div>
  );
}