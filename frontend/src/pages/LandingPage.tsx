// src/pages/LandingPage.tsx

import { Link } from "react-router-dom";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { FeatureIcon1, FeatureIcon2, FeatureIcon3 } from "../components/icons";

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wider">
          FRANCHISE<span className="text-primary">HUB</span>
        </h1>
        <ThemeSwitcher />
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 sm:py-24 text-center">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          Le Hub Central de Votre Franchise.
        </h2>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          Simplifiez la gestion, centralisez vos documents et fluidifiez la
          communication entre tous vos restaurants.
        </p>
        <div className="mt-8">
          <Link
            to="/login"
            className="inline-block bg-primary text-primary-foreground font-bold text-lg px-8 py-4 rounded-md hover:bg-primary/90 transition-transform duration-200 hover:scale-105"
          >
            Accéder à mon espace
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-secondary py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-full text-black mb-4">
                <FeatureIcon1 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-secondary-foreground">Gestion Documentaire</h3>
              <p className="text-secondary-foreground">
                Centralisez toutes vos factures, procédures et documents
                importants en un seul endroit sécurisé.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-full text-black mb-4">
                <FeatureIcon2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-secondary-foreground">Suivi des Tickets</h3>
              <p className="text-secondary-foreground">
                Signalez un problème, suivez sa résolution et communiquez avec
                le support en temps réel.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-full text-black mb-4">
                <FeatureIcon3 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-secondary-foreground">Annonces Centralisées</h3>
              <p className="text-secondary-foreground">
                Diffusez des informations importantes à un ou plusieurs
                restaurants en quelques clics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8">
        <p className="text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} FranchiseHUB. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
