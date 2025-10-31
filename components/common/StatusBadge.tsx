import { ReactNode, ComponentType, SVGProps, SVGAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/types/utils';

export const statusVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500',
        error: 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500',
        warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500',
        info: 'bg-blue-50 text-blue-800 hover:bg-blue-100 focus:ring-blue-500',
        loading: 'bg-blue-100 text-blue-800',
        draft: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500',
        pending: 'bg-amber-100 text-amber-800 hover:bg-amber-200 focus:ring-amber-500',
        completed: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 focus:ring-emerald-500',
        cancelled: 'bg-rose-100 text-rose-800 hover:bg-rose-200 focus:ring-rose-500',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
      },
      pulse: {
        true: 'animate-pulse',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      pulse: false,
    },
  }
);

const statusIcons = {
  default: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
  success: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  ),
  error: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  ),
  warning: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  ),
  info: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  loading: (
    <>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </>
  ),
  draft: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  ),
  pending: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  completed: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  ),
  cancelled: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  ),
};

export type StatusVariant = keyof typeof statusIcons;

export interface StatusBadgeProps 
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusVariants> {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  showIcon?: boolean;
  pulse?: boolean;
  tooltip?: string;
  children?: ReactNode;
}

export function StatusBadge({
  className,
  variant = 'default',
  size = 'default',
  icon: Icon,
  showIcon = true,
  pulse = false,
  tooltip,
  children,
  ...props
}: StatusBadgeProps) {
  const iconToRender = statusIcons[variant as StatusVariant] || statusIcons.default;

  return (
    <span
      className={cn(
        statusVariants({ variant, size, pulse, className }),
        'inline-flex items-center gap-1.5 transition-all duration-200'
      )}
      role="status"
      aria-label={tooltip || `${variant} status`}
      title={tooltip}
      {...props}
    >
      {showIcon && (
        <span className="flex-shrink-0">
          {Icon ? (
            <Icon 
              className={cn(
                size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3',
                size === 'lg' ? 'h-4 w-4' : '',
                variant === 'loading' ? 'animate-spin' : ''
              )} 
            />
          ) : (
            <svg
              className={cn(
                'h-3 w-3',
                size === 'sm' ? 'h-2.5 w-2.5' : '',
                size === 'lg' ? 'h-4 w-4' : '',
                variant === 'loading' ? 'animate-spin' : ''
              )}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {iconToRender}
            </svg>
          )}
        </span>
      )}
      {children && <span>{children}</span>}
    </span>
  );
}
