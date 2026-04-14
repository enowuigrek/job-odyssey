import { useEffect, useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { pdf, DocumentProps } from '@react-pdf/renderer';
import React, { ReactElement } from 'react';
import { CVHtml } from '../templates/cv/CVHtml';
import { CVTemplate } from '../templates/cv/CVTemplate';
import { defaultCVData } from '../templates/cv/defaultCVData';
import { CV_PRINT_STORAGE_KEY } from '../lib/generateCV';
import type { CVData } from '../templates/cv/types';

async function downloadPDF(data: CVData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(CVTemplate, { data }) as unknown as ReactElement<DocumentProps, any>;
  const blob = await pdf(element).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CV Łukasz Nowak.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

export function CVGeneratorPage() {
  const [data, setData] = useState<CVData>(defaultCVData);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await downloadPDF(data);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-lg cursor-pointer"
        >
          {isGenerating
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <FileDown className="w-4 h-4" />}
          {isGenerating ? 'Generuję...' : 'Pobierz PDF'}
        </button>
      </div>

      <CVHtml data={data} preview />
    </div>
  );
}
