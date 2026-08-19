"use client";

import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from '../CartContext';
import { UserProvider } from '../UserContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <UserProvider>
        <CartProvider>{children}</CartProvider>
      </UserProvider>
    </HelmetProvider>
  );
}

