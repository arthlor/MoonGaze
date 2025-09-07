import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, LayoutAnimation, type LayoutAnimationConfig, Platform } from 'react-native';

/**
 * Performance optimization utilities
 */

/**
 * Lazy loading component wrapper for heavy components
 */
export function createLazyComponent<P extends Record<string, unknown> = Record<string, unknown>>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ComponentType,
): React.ComponentType<P> {
  const LazyComponent = React.lazy(importFn);
  
  return React.memo((props: P) => {
    const FallbackComponent = fallback;
    return React.createElement(
      React.Suspense,
      { fallback: FallbackComponent ? React.createElement(FallbackComponent) : null },
      React.createElement(LazyComponent, props as React.Attributes & P),
    );
  });
}

/**
 * Hook for conditional lazy loading based on visibility
 */
export function useConditionalLazyLoad(
  shouldLoad: boolean,
  importFn: () => Promise<{ default: React.ComponentType }>,
): [React.ComponentType | null, boolean] {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const importFnRef = useRef(importFn);

  // Update import function ref when it changes
  useEffect(() => {
    importFnRef.current = importFn;
  }, [importFn]);

  useEffect(() => {
    if (shouldLoad && !Component && !isLoading) {
      setIsLoading(true);
      importFnRef.current()
        .then((module) => {
          setComponent(() => module.default);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [shouldLoad, Component, isLoading]);

  return [Component, isLoading];
}

/**
 * Debounce hook for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for frequent operations
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T {
  const lastRun = useRef(Date.now());
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callbackRef.current(...args);
        lastRun.current = Date.now();
      }
    },
    [delay],
  );

  return throttledCallback as T;
}

/**
 * Memoized callback that only changes when dependencies change
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList,
): T {
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stableCallback = useCallback(
    (...args: Parameters<T>) => callbackRef.current(...args),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  return stableCallback as T;
}

/**
 * Memoized value that only recalculates when dependencies change
 */
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
): T {
  const factoryRef = useRef(factory);
  
  // Update factory ref when factory changes
  useEffect(() => {
    factoryRef.current = factory;
  }, [factory]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factoryRef.current(), deps);
}

/**
 * Hook for running expensive operations after interactions
 */
export function useInteractionManager(
  callback: () => void,
  deps: React.DependencyList,
): void {
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => callbackRef.current());
    return () => task.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook for managing component mounting state
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Hook for preventing memory leaks in async operations
 */
export function useSafeAsyncCallback<T extends (...args: unknown[]) => Promise<unknown>>(
  callback: T,
): T {
  const isMounted = useIsMounted();
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const safeCallback = useCallback(
    async (...args: Parameters<T>) => {
      if (isMounted()) {
        return await callbackRef.current(...args);
      }
      return undefined;
    },
    [isMounted],
  );

  return safeCallback as T;
}

/**
 * Hook for optimized list rendering with enhanced performance
 */
export function useOptimizedList<T>(
  data: T[],
  keyExtractor: (item: T, index: number) => string,
  itemHeight?: number,
) {
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    
    return (_data: unknown, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  const keyExtractorMemo = useCallback(keyExtractor, [keyExtractor]);

  return {
    data,
    keyExtractor: keyExtractorMemo,
    getItemLayout,
    // Enhanced optimization props for FlatList
    removeClippedSubviews: true,
    maxToRenderPerBatch: 8, // Reduced for better performance
    windowSize: 8, // Reduced for better memory usage
    initialNumToRender: 6, // Reduced for faster initial render
    updateCellsBatchingPeriod: 100, // Increased for smoother scrolling
    // Additional performance optimizations
    disableVirtualization: false,
    legacyImplementation: false,
  };
}

/**
 * Hook for optimized scroll performance
 */
export function useOptimizedScroll() {
  const scrollHandler = useCallback((event: { nativeEvent: { contentOffset: { x: number; y: number } } }) => {
    // Throttled scroll handling for better performance
    const { contentOffset } = event.nativeEvent;
    return contentOffset;
  }, []);

  return {
    scrollHandler,
    scrollEventThrottle: 16, // 60fps
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
  };
}

/**
 * Hook for managing focus state efficiently
 */
export function useFocusManager() {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);

  const setFocus = useCallback((elementId: string) => {
    setFocusedElement(elementId);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedElement(null);
  }, []);

  const isFocused = useCallback(
    (elementId: string) => focusedElement === elementId,
    [focusedElement],
  );

  return {
    focusedElement,
    setFocus,
    clearFocus,
    isFocused,
  };
}

/**
 * Hook for smooth animations with reduced motion support
 */
export function useAccessibleAnimation(
  reduceMotionEnabled: boolean = false,
) {
  const animate = useCallback(
    (config?: LayoutAnimationConfig) => {
      if (reduceMotionEnabled) {
        // Skip animations if reduce motion is enabled
        return;
      }

      if (Platform.OS === 'ios') {
        LayoutAnimation.configureNext(
          config || LayoutAnimation.Presets.easeInEaseOut,
        );
      }
    },
    [reduceMotionEnabled],
  );

  return { animate };
}

/**
 * Hook for managing keyboard navigation
 */
export function useKeyboardNavigation() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsRef = useRef<Array<{ focus?: () => void }>>([]);

  const registerItem = useCallback((item: { focus?: () => void }, index: number) => {
    itemsRef.current[index] = item;
  }, []);

  const focusNext = useCallback(() => {
    const nextIndex = Math.min(currentIndex + 1, itemsRef.current.length - 1);
    setCurrentIndex(nextIndex);
    const nextItem = itemsRef.current[nextIndex];
    if (nextItem && typeof nextItem.focus === 'function') {
      nextItem.focus();
    }
  }, [currentIndex]);

  const focusPrevious = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    setCurrentIndex(prevIndex);
    const prevItem = itemsRef.current[prevIndex];
    if (prevItem && typeof prevItem.focus === 'function') {
      prevItem.focus();
    }
  }, [currentIndex]);

  const focusFirst = useCallback(() => {
    setCurrentIndex(0);
    const firstItem = itemsRef.current[0];
    if (firstItem && typeof firstItem.focus === 'function') {
      firstItem.focus();
    }
  }, []);

  const focusLast = useCallback(() => {
    const lastIndex = itemsRef.current.length - 1;
    setCurrentIndex(lastIndex);
    const lastItem = itemsRef.current[lastIndex];
    if (lastItem && typeof lastItem.focus === 'function') {
      lastItem.focus();
    }
  }, []);

  return {
    currentIndex,
    registerItem,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
}



