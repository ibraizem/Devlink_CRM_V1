// Permet l'importation de fichiers SVG comme composants React
declare module '*.svg' {
  import { FC, SVGProps } from 'react';
  const content: FC<SVGProps<SVGElement>>;
  export default content;
}

// Déclare les types pour les modules CSS
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Déclare les types pour les modules SCSS
declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// Déclare les types pour les fichiers d'images
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.webp';

// Déclare les types pour les fichiers de police
declare module '*.woff';
declare module '*.woff2';
declare module '*.ttf';
declare module '*.eot';

// Déclare les types pour les fichiers de données
declare module '*.json' {
  const value: any;
  export default value;
}
