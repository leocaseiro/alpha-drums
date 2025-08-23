'use client';

import React from 'react';
import { ChakraProvider, defaultSystem, Box } from '@chakra-ui/react';
import { I18nProvider } from './i18n';
import I18nSwitcher from './I18nSwitcher';
import { AppToaster } from './toaster';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
      <I18nProvider>
        <Box position="fixed" top={2} right={2} zIndex={20}>
          <I18nSwitcher />
        </Box>
        <AppToaster />
        {children}
      </I18nProvider>
    </ChakraProvider>
  );
}
