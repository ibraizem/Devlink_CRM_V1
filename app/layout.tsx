import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import { Providers } from './providers';
import { clerkConfig } from '@/lib/clerk/config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CRM Téléprospection',
  description: 'CRM SaaS spécialisé en téléprospection et prise de rendez-vous',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider 
      localization={frFR}
      appearance={clerkConfig.appearance}
    >
      <html lang="fr">
        <head>
          <link 
            rel="stylesheet" 
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
            integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
            crossOrigin="anonymous" 
            referrerPolicy="no-referrer" 
          />
        </head>
        <body className={`${inter.className} overflow-x-hidden min-h-screen`}>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
