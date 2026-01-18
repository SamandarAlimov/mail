import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";

interface ThemeLoaderProps {
  children: React.ReactNode;
}

export function ThemeLoader({ children }: ThemeLoaderProps) {
  const { isLoaded } = useTheme();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex flex-col gap-2 w-64">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="mt-4 animate-pulse">
            <div className="h-1 w-24 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-primary rounded-full animate-[shimmer_1s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
