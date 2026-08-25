'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SERVICE_CATEGORIES } from './categories';

export default function JobRequestWidget({
  category,
  onCategoryChange,
  className,
}: {
  category: string;
  onCategoryChange: (value: string) => void;
  className?: string;
}) {
  const router = useRouter();
  const [zip, setZip] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (zip.trim()) params.set('zip', zip.trim());
    router.push(`/request${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`lw-card-light mx-auto flex w-full max-w-3xl flex-col gap-3 p-4 md:flex-row md:items-center md:gap-3 md:p-3 ${className ?? ''}`}
    >
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="h-14 flex-1 text-base">
          <SelectValue placeholder="What do you need help with?" />
        </SelectTrigger>
        <SelectContent>
          {SERVICE_CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        placeholder="ZIP code"
        inputMode="numeric"
        maxLength={10}
        className="h-14 text-base md:w-40"
      />

      <Button
        type="submit"
        size="lg"
        className="h-14 shrink-0 bg-lw-rust text-base font-semibold text-white hover:bg-lw-rust-hover"
      >
        Get Matched
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
