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

export const toaster = createToaster({ placement: 'top-end', gap: 12, max: 5, duration: 3000 });

export const AppToaster = () => (
  <Toaster toaster={toaster}>
    {(toast) => (
      <ToastRoot>
        <ToastIndicator />
        <ToastTitle>{toast.title}</ToastTitle>
        {toast.description ? <ToastDescription>{toast.description}</ToastDescription> : null}
        <ToastCloseTrigger />
      </ToastRoot>
    )}
  </Toaster>
);
