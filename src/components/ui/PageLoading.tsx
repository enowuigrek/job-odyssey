import { Loader2 } from 'lucide-react';

/** Fallback dla React.lazy() stron — pokazuje się na czas pobrania chunku strony. */
export function PageLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-slate-500">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}
