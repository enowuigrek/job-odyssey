import { useEffect, useState } from 'react';
import { FileDown, Loader2, FileEdit } from 'lucide-react';
import { pdf, DocumentProps } from '@react-pdf/renderer';
import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { CVHtml } from '../templates/cv/CVHtml';
import { CVTemplate } from '../templates/cv/CVTemplate';
import { CV_PRINT_STORAGE_KEY, getCVEditorData } from '../lib/generateCV';
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
  const navigate = useNavigate();
  const [data, setData] = useState<CVData>(getCVEditorData);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(CV_PRINT_STORAGE_KEY);
    if (raw) {
      try {
        setData(JSON.parse(raw) as CVData);
      } catch {
        // ignore, use editor data
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
    <div>
      <div className="sticky top-0 z-50 bg-dark-900 border-b border-dark-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/cv-editor')}
          className="flex items-center gap-1.5 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-slate-300 text-sm transition-colors cursor-pointer flex-shrink-0"
        >
          <FileEdit className="w-4 h-4" />
          <span className="hidden sm:inline">Edytuj</span>
        </button>
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 flex-1 px-6 py-2.5 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 text-slate-900 text-sm font-medium transition-colors cursor-pointer"
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
