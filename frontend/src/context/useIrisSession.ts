import { useContext } from 'react';
import { IrisSessionContext } from './IrisSessionContextTypes';

export function useIrisSession() {
  const ctx = useContext(IrisSessionContext);
  if (!ctx) {
    throw new Error('useIrisSession must be used within an IrisSessionProvider');
  }
  return ctx;
}
