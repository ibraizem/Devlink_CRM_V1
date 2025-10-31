import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(text: string, length: number) {
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function isObjectEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

export function getStatusVariant(
  status: string
): 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading' {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'completed':
    case 'active':
      return 'success';
    case 'error':
    case 'failed':
    case 'rejected':
      return 'error';
    case 'warning':
    case 'pending':
    case 'processing':
      return 'warning';
    case 'info':
    case 'draft':
      return 'info';
    case 'loading':
      return 'loading';
    default:
      return 'default';
  }
}
