'use client';

import React from 'react';
import {
  Toaster,
  createToaster,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastIndicator,
  ToastCloseTrigger,
} from '@chakra-ui/react';

export const toaster = createToaster({ placement: 'bottom-end', gap: 12, max: 5, duration: 3000 });

export const AppToaster = () => (
  <Toaster toaster={toaster}>
    {(toast) => (
      <ToastRoot minWidth="320px" maxWidth="500px" p={4} display="flex" flexDirection="row" alignItems="start" gap={3}>
        <ToastIndicator />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <ToastTitle fontSize="md" fontWeight="semibold">{toast.title}</ToastTitle>
          {toast.description ? <ToastDescription fontSize="sm">{toast.description}</ToastDescription> : null}
        </div>
        <ToastCloseTrigger />
      </ToastRoot>
    )}
  </Toaster>
);
