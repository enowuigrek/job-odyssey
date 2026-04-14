import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { CVHtml } from '../templates/cv/CVHtml';
import { defaultCVData } from '../templates/cv/defaultCVData';
import { CV_PRINT_STORAGE_KEY } from '../lib/generateCV';
import type { CVData } from '../templates/cv/types';

export function CVGeneratorPage() {
  const [data, setData] = useState<CVData>(defaultCVData);

  useEffect(() => {
    const raw = localStorage.getItem(CV_PRINT_STORAGE_KEY);
    if (raw) {
      try {
        setData(JSON.parse(raw) as CVData);
      } catch {
        // ignore, use default
      }
      localStorage.removeItem(CV_PRINT_STORAGE_KEY);
    }
  }, []);

  return (
    <div className="relative">
      {/* Print button — hidden when printing */}
      <div className="fixed top-4 right-4 z-50 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-400 text-white text-sm font-medium transition-colors shadow-lg cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Drukuj / Pobierz PDF
        </button>
      </div>

      <CVHtml data={data} preview />
    </div>
  );
}
