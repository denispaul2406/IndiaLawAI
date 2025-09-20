import { Gavel } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-headline">
      <Gavel className="h-6 w-6 text-primary" />
      <span className="text-lg font-bold text-foreground">IndiaLawAI</span>
    </Link>
  );
}
