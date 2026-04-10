import React from 'react';
import { Loader2, WifiOff, AlertTriangle, RefreshCw, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StateCoverageProps {
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  disconnected?: boolean;
  emptyIcon?: React.ElementType;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  onRetry?: () => void;
  loadingRows?: number;
}

const StateCoverage: React.FC<StateCoverageProps> = ({
  children,
  loading,
  empty,
  error,
  disconnected,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Items will appear here once they\'re added',
  emptyAction,
  onRetry,
  loadingRows = 3,
}) => {
  if (disconnected) {
    return (
      <div className="p-4 bg-status-waiting/5 border border-status-waiting/20 rounded-xl flex items-center gap-3">
        <WifiOff className="w-5 h-5 text-status-waiting shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Not connected</p>
          <p className="text-xs text-muted-foreground">Check your connection and try again</p>
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="w-3 h-3" /> Retry
          </Button>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Something went wrong</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="w-3 h-3" /> Retry
          </Button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: loadingRows }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
          <EmptyIcon className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{emptyDescription}</p>
        {emptyAction && (
          <Button size="sm" className="mt-4" onClick={emptyAction.onClick}>
            {emptyAction.label}
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default StateCoverage;
