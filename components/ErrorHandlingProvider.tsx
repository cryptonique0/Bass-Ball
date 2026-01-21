'use client';

import React, { useEffect } from 'react';
import { getErrorHandler, logBreadcrumb } from '@/lib/errorHandler';

interface Props {
  children: React.ReactNode;
}

/**
 * ErrorHandlingProvider
 * Ensures the global error handler is initialized and
 * records a breadcrumb for app startup.
 */
export function ErrorHandlingProvider({ children }: Props) {
  useEffect(() => {
    const handler = getErrorHandler();
    // Record initial breadcrumb
    logBreadcrumb('app', 'info', 'App initialized');
    // Optionally, set user context here if available
    // handler.setUserContext(address, chainId);
  }, []);

  return <>{children}</>;
}

export default ErrorHandlingProvider;
