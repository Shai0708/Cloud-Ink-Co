
import React, { useEffect, useMemo } from 'react';
import { CloseIcon } from './icons';

interface DetailsModalProps {
  data: any;
  headers: string[];
  dataKeys: string[];
  title: string;
  onClose: () => void;
}

const getNestedValue = (obj: any, path: string): any => {
    if (!path) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const DetailsModal: React.FC<DetailsModalProps> = ({ data, headers, dataKeys, title, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const details = useMemo(() => {
    return dataKeys.map((key, index) => ({
      header: headers[index],
      value: getNestedValue(data, key),
    }));
  }, [data, headers, dataKeys]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.3s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-modal-title"
    >
      <div
        className="bg-[#1F2937] border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20 w-full max-w-2xl max-h-[90vh] flex flex-col animate-[slideIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <h2 id="details-modal-title" className="text-lg font-semibold text-white tracking-wider">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Close details modal"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {details.map(({ header, value }) => (
              <div key={header} className="bg-[#111827]/50 p-3 rounded-md">
                <dt className="text-sm font-medium text-gray-400">{header}</dt>
                <dd className="mt-1 text-md text-white break-words">{String(value ?? 'N/A')}</dd>
              </div>
            ))}
          </dl>
        </main>
      </div>
       <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(20px) scale(0.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
      `}</style>
    </div>
  );
};

export default DetailsModal;
