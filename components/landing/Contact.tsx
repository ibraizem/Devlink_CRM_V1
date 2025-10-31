'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowRight, Zap, MailCheck } from 'lucide-react';
import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isNewsletterSubscribed, setIsNewsletterSubscribed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simuler un envoi de formulaire
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Réinitialiser le formulaire après 5 secondes
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      setIsSubmitted(false);
    }, 5000);
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simuler un abonnement à la newsletter
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsNewsletterSubscribed(true);
    setNewsletterEmail('');
    
    setTimeout(() => {
      setIsNewsletterSubscribed(false);
    }, 5000);
  };

  const contactMethods = [
    {
      icon: <Mail className="h-5 w-5 text-blue-400" />,
      title: 'Email',
      value: 'contact@devlink-crm.com',
      href: 'mailto:contact@devlink-crm.com',
    },
    {
      icon: <Phone className="h-5 w-5 text-purple-400" />,
      title: 'Téléphone',
      value: '+33 1 23 45 67 89',
      href: 'tel:+33123456789',
    },
    {
      icon: <MapPin className="h-5 w-5 text-cyan-400" />,
      title: 'Bureau',
      value: '123 Rue de la République, 75001 Paris',
      href: 'https://maps.google.com',
    },
  ];

  const socialLinks = [
    { name: 'Twitter', icon: 'twitter', color: 'hover:bg-blue-500/10 hover:text-blue-400' },
    { name: 'LinkedIn', icon: 'linkedin', color: 'hover:bg-blue-600/10 hover:text-blue-500' },
    { name: 'GitHub', icon: 'github', color: 'hover:bg-gray-800/10 hover:text-gray-800' },
    { name: 'Discord', icon: 'discord', color: 'hover:bg-indigo-500/10 hover:text-indigo-400' },
  ];

  return (
    <section id="contact" className="relative py-20 overflow-hidden bg-gradient-to-b from-blue-500 via-blue-950 to-blue-500">
      {/* Effets visuels futuristes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-500 mb-4">
            <Zap className="w-4 h-4 mr-2" />
            Contactez-nous
          </span>
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 mb-4">
            Prêt à transformer votre activité ?
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Notre équipe est là pour répondre à vos questions et vous aider à démarrer avec DevLink CRM.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulaire de contact */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-500 via-blue-950 to-blue-500 backdrop-blur-lg rounded-2xl border border-gray-700/50 p-6 shadow-2xl"
          >
            <div className="flex items-center mb-8">
              <div className="p-3 rounded-xl bg-blue-400">
                <Send className="h-6 w-6 text-white" />
              </div>
              <h3 className="ml-3 text-xl font-bold text-white">Envoyez-nous un message</h3>
            </div>
            
            <div className="space-y-8">
              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">Message envoyé !</h4>
                  <p className="text-gray-300">Nous vous répondrons dans les plus brefs délais.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-white">
                      Nom complet <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-white border-blue-600 text-blue-900   placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Votre nom"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-white">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-white border-blue-600 text-blue-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="votre@email.com"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Mail className="h-5 w-5 text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-white">
                    Sujet <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full bg-white border-blue-600 text-blue-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Objet de votre message"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium text-white">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-white border-blue-600 text-blue-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez votre projet ou posez-nous vos questions..."
                  />
                </div>
                
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <span className="relative z-10 flex items-center">
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer le message
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
              )}

              {/* Newsletter déplacée ici */}
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl border border-blue-700/30 p-6 shadow-2xl backdrop-blur-sm">
                <div className="flex items-start">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300">
                    <MailCheck className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-bold text-white">Newsletter</h3>
                    <p className="text-sm text-blue-100/80 mt-1">
                      Abonnez-vous pour recevoir nos dernières actualités et offres exclusives.
                    </p>
                  </div>
                </div>
                
                {isNewsletterSubscribed ? (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-300 text-center">
                      Merci pour votre inscription à notre newsletter !
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletter} className="mt-4">
                    <div className="flex">
                      <div className="relative flex-grow">
                        <Input
                          type="email"
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          required
                          placeholder="Votre adresse email"
                          className="w-full bg-white/90 border-blue-600 text-blue-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-r-none h-10 text-sm"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <Mail className="h-4 w-4 text-blue-400" />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 px-4 text-sm rounded-l-none border-l border-blue-700/50 transition-all duration-300"
                      >
                        S'inscrire
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>

          {/* Colonne de droite */}
          <div className="space-y-8">
            {/* Carte de contact */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-500 via-blue-950 to-blue-500 rounded-2xl border border-blue-500 p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-6">Nos coordonnées</h3>
              <p className="text-gray-300 mb-8">
                Notre équipe est disponible pour répondre à toutes vos questions. N'hésitez pas à nous contacter par téléphone, email ou via le formulaire.
              </p>
              
              <div className="space-y-6">
                {contactMethods.map((method, index) => (
                  <motion.a
                    key={index}
                    href={method.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start space-x-4 group"
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="flex-shrink-0 p-2.5 rounded-xl bg-gray-700/50 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      {method.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-200">{method.title}</h4>
                      <p className="text-gray-400 group-hover:text-blue-300 transition-colors">{method.value}</p>
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* Section Suivez-nous déplacée ici */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-white mb-4">Suivez-nous</h4>
                <div className="flex space-x-3">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={index}
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center w-10 h-10 rounded-xl bg-blue-400 text-white ${social.color} transition-all duration-300`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="sr-only">{social.name}</span>
                      <i className={`fab fa-${social.icon} text-lg`}></i>
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Section Prêt à démarrer déplacée ici */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-bold text-white mb-3">Prêt à démarrer ?</h3>
                <p className="text-blue-100/80 text-sm mb-4">
                  Essayez notre plateforme dès aujourd'hui.
                </p>
                <div className="flex flex-col space-y-3">
                  <Button 
                    className="w-full bg-white text-blue-900 hover:bg-blue-100 font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20"
                    size="sm"
                  >
                    Essai gratuit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full bg-transparent text-white border-blue-400/30 hover:bg-blue-500/10 hover:border-blue-400/50 transition-all duration-300"
                    size="sm"
                  >
                    Voir les tarifs
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* La newsletter a été déplacée sous le formulaire de contact */}

            {/* La section CTA et Réseaux sociaux a été déplacée dans la carte de contact de gauche */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;