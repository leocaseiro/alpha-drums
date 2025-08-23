'use client';

import React from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { I18nProvider } from './i18n';
import { AppToaster } from './toaster';
import { MidiProvider } from '@/context/MidiContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
      <MidiProvider>
        <I18nProvider>
          <AppToaster />
          {children}
        </I18nProvider>
      </MidiProvider>
    </ChakraProvider>
  );
}
