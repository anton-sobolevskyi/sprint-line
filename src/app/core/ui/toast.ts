import { toast } from '@spartan-ng/brain/sonner';

/** Thin wrappers so call sites stay consistent and easy to mock later. */
export const appToast = {
  success: (message: string, description?: string) =>
    toast.success(message, description ? { description } : undefined),
  error: (message: string, description?: string) =>
    toast.error(message, description ? { description } : undefined),
  info: (message: string, description?: string) =>
    toast.info(message, description ? { description } : undefined),
  message: (message: string, description?: string) =>
    toast(message, description ? { description } : undefined),
} as const;
