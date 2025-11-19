import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DevLink CRM - Gestion complète de votre relation client',
  description: 'DevLink CRM - Solution tout-en-un pour la gestion de la relation client, la téléprospection et la prise de rendez-vous',
  icons: {
    icon: '/faviconcrm.ico',
    apple: '/faviconcrm.ico',
  },
  themeColor: '#0f172a',
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'DevLink CRM',
    description: 'Solution complète de gestion de la relation client',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevLink CRM',
    description: 'Solution complète de gestion de la relation client',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="description" content="DevLink CRM - Solution tout-en-un pour la gestion de la relation client, la téléprospection et la prise de rendez-vous" />
        
        {/* Favicon */}
        <link rel="icon" href="/faviconcrm.ico" />
        <link rel="apple-touch-icon" href="/faviconcrm.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Font Awesome */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
        
        {/* SEO */}
        <meta property="og:title" content="DevLink CRM" />
        <meta property="og:description" content="Solution complète de gestion de la relation client" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DevLink CRM" />
        <meta name="twitter:description" content="Solution complète de gestion de la relation client" />
      </head>
      <body className={`${inter.className} overflow-x-hidden min-h-screen`}>
        <Providers>
          <Toaster 
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              style: { fontFamily: 'inherit' },
              classNames: {
                toast: '!bg-card !border !border-border',
                title: '!text-foreground',
                description: '!text-muted-foreground',
                success: '!bg-green-50 !text-green-700 !border-green-200',
                error: '!bg-red-50 !text-red-700 !border-red-200',
                warning: '!bg-amber-50 !text-amber-700 !border-amber-200',
                info: '!bg-blue-50 !text-blue-700 !border-blue-200',
              },
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
