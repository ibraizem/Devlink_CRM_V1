import { ClassValue } from 'clsx';

declare module '@/lib/utils' {
  export function cn(...inputs: ClassValue[]): string;
  export function formatDate(date: Date | string): string;
  export function formatDateTime(date: Date | string): string;
  export function truncate(text: string, length: number): string;
  export function getInitials(name: string): string;
  export function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void;
  export function isObjectEmpty(obj: Record<string, any>): boolean;
  export function getStatusVariant(
    status: string
  ): 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';
}
