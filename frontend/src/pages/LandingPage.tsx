// src/pages/LandingPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import ThemeSwitcher from "../components/ThemeSwitcher";

// --- ICÔNES SVG pour les fonctionnalités ---
const FeatureIcon1 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0V5.625m0 0a2.25 2.25 0 01-2.25 2.25H6.75m-1.125 0V11.25m0 0a2.25 2.25 0 012.25 2.25m0 0a2.25 2.25 0 01-2.25 2.25m0 0V18m2.25-2.25h1.5m5.375-7.5a2.25 2.25 0 012.25 2.25m0 0a2.25 2.25 0 01-2.25 2.25m0 0V18m2.25-2.25h-5.375M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const FeatureIcon2 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 6H3.75A2.25 2.25 0 001.5 8.25v8.25A2.25 2.25 0 003.75 18z"
    />
  </svg>
);
const FeatureIcon3 = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-8 h-8"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 6a7.5 7.5 0 100 12h-3a7.5 7.5 0 00-7.5-7.5h1.5v-1.5a7.5 7.5 0 007.5-7.5h3z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 18.75h-1.5a7.5 7.5 0 00-7.5-7.5h-1.5v-1.5a7.5 7.5 0 017.5-7.5h1.5v16.5z"
    />
  </svg>
);

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
                <FeatureIcon1 />
              </div>
              <h3 className="text-xl font-bold mb-2 text-secondary-foreground">Gestion Documentaire</h3>
              <p className="text-secondary-foreground">
                Centralisez toutes vos factures, procédures et documents
                importants en un seul endroit sécurisé.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-full text-black mb-4">
                <FeatureIcon2 />
              </div>
              <h3 className="text-xl font-bold mb-2 text-secondary-foreground">Suivi des Tickets</h3>
              <p className="text-secondary-foreground">
                Signalez un problème, suivez sa résolution et communiquez avec
                le support en temps réel.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-full text-black mb-4">
                <FeatureIcon3 />
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
