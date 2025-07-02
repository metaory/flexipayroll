/**
 * Notification system using Skeleton's toast
 */

import { Toaster, toast } from '@skeletonlabs/skeleton-svelte';

export const notify = {
  success(message, options = {}) {
    toast.push(message, {
      background: 'variant-filled-success',
      ...options
    });
  },
  
  error(message, options = {}) {
    toast.push(message, {
      background: 'variant-filled-error',
      ...options
    });
  },
  
  warning(message, options = {}) {
    toast.push(message, {
      background: 'variant-filled-warning',
      ...options
    });
  },
  
  info(message, options = {}) {
    toast.push(message, {
      background: 'variant-filled-primary',
      ...options
    });
  }
};

export { Toaster }; 