/**
 * React Query Error Boundary
 * Specialized error boundary for React Query errors
 */

import React from 'react';
import {QueryErrorResetBoundary} from '@tanstack/react-query';
import {ErrorBoundary} from './ErrorBoundary';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const QueryErrorBoundary: React.FC<Props> = ({children, fallback}) => {
  return (
    <QueryErrorResetBoundary>
      {({reset}) => (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('🚨 Query Error Boundary:', {
              error: error.message,
              stack: error.stack,
              componentStack: errorInfo.componentStack,
            });
          }}
          fallback={fallback}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};






