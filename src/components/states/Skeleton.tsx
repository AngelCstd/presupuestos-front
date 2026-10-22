import { cx } from '@/lib/ui/cx';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx('animate-pulse rounded-md bg-muted-background', className)}
    />
  );
}
