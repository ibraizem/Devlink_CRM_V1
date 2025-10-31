import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Composants dynamiques pour le chargement optimisé
const Navbar = dynamic(() => import('@/components/landing/Navbar'), {
  ssr: false,
  loading: () => <div className="h-20 bg-white w-full fixed top-0 left-0 right-0 z-50 shadow-sm" />
});

const Hero = dynamic(() => import('@/components/landing/Hero'), {
  ssr: true,
  loading: () => <div className="h-screen bg-blue-50" />
});

const Features = dynamic(() => import('@/components/landing/Features'), {
  ssr: true
});

const Pricing = dynamic(() => import('@/components/landing/Pricing'), {
  ssr: true
});

const Contact = dynamic(() => import('@/components/landing/Contact'), {
  ssr: true
});

const Footer = dynamic(() => import('@/components/landing/Footer'), {
  ssr: false
});

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-20 bg-white w-full fixed top-0 left-0 right-0 z-50 shadow-sm" />}>
        <Navbar />
      </Suspense>
      
      <main className="overflow-hidden">
        <Suspense fallback={<div className="h-screen bg-blue-50" />}>
          <Hero />
        </Suspense>
        
        <Suspense fallback={<div className="py-20 bg-white"><div className="container mx-auto px-4">Chargement des fonctionnalités...</div></div>}>
          <Features />
        </Suspense>
        
        <Suspense fallback={<div className="py-20 bg-gray-50"><div className="container mx-auto px-4">Chargement des offres...</div></div>}>
          <Pricing />
        </Suspense>
        
        <Suspense fallback={<div className="py-20 bg-white"><div className="container mx-auto px-4">Chargement du formulaire de contact...</div></div>}>
          <Contact />
        </Suspense>
      </main>
      
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}