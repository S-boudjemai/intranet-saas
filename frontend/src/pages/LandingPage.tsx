// src/pages/LandingPage.tsx

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { ChartPieIcon, DocumentReportIcon, SpeakerphoneIcon, ArrowRightIcon } from "../components/icons";

export default function LandingPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 lg:p-6 flex justify-between items-center border-b border-border/50"
      >
        <motion.h1 
          whileHover={{ scale: 1.02 }}
          className="text-xl font-bold tracking-wider cursor-pointer"
        >
          FRANCHISE<span className="text-primary">DESK</span>
        </motion.h1>
        <ThemeSwitcher />
      </motion.header>

      {/* Hero Section */}
      <motion.main 
        className="container mx-auto px-4 py-20 lg:py-32"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeInUp}>
            <h2 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
              Pilotez votre réseau de
              <span className="block text-primary">franchises</span>
              <span className="text-4xl lg:text-6xl text-muted-foreground font-normal">en toute simplicité</span>
            </h2>
          </motion.div>

          <motion.p 
            variants={fadeInUp}
            className="mt-8 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Contrôlez la qualité, standardisez les processus et communiquez avec tous vos franchisés depuis une plateforme unifiée.
          </motion.p>

          <motion.div 
            variants={fadeInUp}
            className="mt-12 space-y-4"
          >
            <Link
              to="/contact"
              className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-lg px-10 py-5 rounded-xl hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Demander une démo
              <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <div>
              <span className="text-muted-foreground">Déjà membre ? </span>
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Connectez-vous
              </Link>
            </div>
          </motion.div>

          <motion.div 
            variants={fadeInUp}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Déployé en 5 minutes
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Sécurisé et conforme
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Mobile-first
            </span>
          </motion.div>
        </div>
      </motion.main>

      {/* Problem Statement */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 bg-muted/30"
      >
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-foreground leading-tight">
              Gérer un réseau de franchises sans outils adaptés,<br />
              <span className="text-muted-foreground">c'est perdre le contrôle de votre marque</span>
            </h3>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Entre la communication dispersée, les contrôles qualité manuels et l'absence de visibilité temps réel, 
              vous passez plus de temps à "éteindre les feux" qu'à développer votre réseau.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 lg:py-32"
      >
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h3 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              Une solution complète pour
              <span className="block text-primary">reprendre le contrôle</span>
            </h3>
          </motion.div>

          <motion.div 
            initial="initial"
            whileInView="animate"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-12"
          >
            <motion.div 
              variants={fadeInUp}
              className="group p-8 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-background border border-border rounded-xl group-hover:border-primary/50 transition-colors">
                  <ChartPieIcon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-foreground">Audits & Conformité</h4>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Système d'audits avec templates personnalisés, suivi des non-conformités et actions correctives. 
                Garantissez l'excellence sur tout votre réseau.
              </p>
              <span className="text-sm text-primary font-medium">
                Économisez 15h/semaine de contrôles
              </span>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="group p-8 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-background border border-border rounded-xl group-hover:border-primary/50 transition-colors">
                  <DocumentReportIcon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-foreground">Pilotage Temps Réel</h4>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Dashboard centralisé avec métriques business, suivi des performances et alertes automatiques. 
                Une vision globale de votre réseau 24/7.
              </p>
              <span className="text-sm text-primary font-medium">
                Détectez les problèmes avant qu'ils s'aggravent
              </span>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="group p-8 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-background border border-border rounded-xl group-hover:border-primary/50 transition-colors">
                  <SpeakerphoneIcon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-foreground">Communication Unifiée</h4>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Diffusion instantanée d'annonces, procédures et formations à tout votre réseau. 
                Fini les appels individuels et les malentendus.
              </p>
              <span className="text-sm text-primary font-medium">
                Touchez 100% de vos franchisés en 1 clic
              </span>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 bg-muted/30"
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-foreground">
              Prêt à reprendre le contrôle ?
            </h3>
            <p className="text-xl text-muted-foreground mb-8">
              Rejoignez les franchiseurs qui ont transformé leur gestion avec FranchiseDesk.
            </p>
            <Link
              to="/contact"
              className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-lg px-10 py-5 rounded-xl hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Commencer maintenant
              <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="border-t border-border/50 py-8"
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} FranchiseDesk. Tous droits réservés.
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
