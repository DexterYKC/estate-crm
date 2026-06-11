import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Loading({ className }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-10 text-blue-600', className)}>
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm font-medium">Chargement…</span>
    </div>
  );
}
