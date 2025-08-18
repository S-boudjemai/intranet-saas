// src/pages/DashboardPage.tsx
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KpiCard from "../components/KipCard";
import { 
  ChartPieIcon, 
  DocumentReportIcon, 
  ExclamationCircleIcon,
  TicketIcon, 
  RestaurantIcon,
  TrendingUpIcon
} from "../components/icons";
import { DashboardSkeleton } from "../components/Skeleton";
import { PageHeader, PageContent, PageCard } from "../components/ui/PageAnimations";
import { TestPushButton } from "../components/TestPushButton";

interface Restaurant {
  id: string;
  name: string;
  city: string;
  address?: string;
}

interface ComparisonsData {
  docsPreviousWeek: number;
  ticketsNonTraiteePreviousWeek: number;
}

interface DashboardData {
  // KPIs existants
  totalDocuments: number;
  docsThisWeek: number;
  ticketsByStatus: Record<string, number>;
  ticketsPerDay: { date: string; count: number }[];
  // KPIs maintenus
  totalRestaurants: number;
  // 📊 COMPARAISONS TEMPORELLES
  comparisons?: ComparisonsData;
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger les données");
        return res.json();
      })
      .then((json: any) => {
        setData(json.data || json);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Couleurs modernes pour les graphiques
  const chartColors = useMemo(() => {
    return {
      grid: "#e5e7eb",
      text: "#6b7280",
      line: "#2563eb",
      tooltipBg: "#ffffff",
      tooltipBorder: "#e5e7eb",
      tooltipText: "#1f2937",
      primary: "#2563eb",
      secondary: "#10b981",
      warning: "#f59e0b",
      danger: "#ef4444",
    };
  }, []);

  // 📊 Fonction pour calculer les tendances avec comparaisons
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, isPositive: true };
    const percentage = Math.round(((current - previous) / previous) * 100);
    return { 
      percentage: Math.abs(percentage), 
      isPositive: percentage >= 0 
    };
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-2xl flex items-center space-x-4 m-6 shadow-sm"
      >
        <ExclamationCircleIcon className="h-8 w-8" />
        <span className="font-medium text-lg">
          Erreur : Impossible de charger les données du tableau de bord.
        </span>
      </motion.div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header avec titre */}
      <PageHeader>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-4">
          <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl">
            <ChartPieIcon className="h-6 w-6 text-primary" />
          </div>
          <span>Dashboard</span>
        </h1>
      </PageHeader>

      {/* KPIs Essentiels - 3 métriques critiques avec tendances */}
      <PageContent
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <KpiCard
          title="Réseau"
          value={data.totalRestaurants}
          icon={<RestaurantIcon />}
          index={0}
          subtitle="restaurants"
          // Pas de comparaison pour le nombre total de restaurants
        />
        <KpiCard
          title="Support actif"
          value={data.ticketsByStatus?.non_traitee || 0}
          icon={<TicketIcon />}
          index={1}
          subtitle="tickets en attente"
          trend={data.comparisons ? calculateTrend(
            data.ticketsByStatus?.non_traitee || 0,
            data.comparisons.ticketsNonTraiteePreviousWeek
          ) : undefined}
        />
        <KpiCard
          title="Documents"
          value={data.totalDocuments}
          icon={<DocumentReportIcon />}
          index={2}
          subtitle="fichiers disponibles"
          trend={data.comparisons ? calculateTrend(
            data.docsThisWeek,
            data.comparisons.docsPreviousWeek
          ) : undefined}
        />
      </PageContent>

      {/* Graphique Tickets - Version améliorée */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Évolution des tickets (7 derniers jours)
          </h2>
          <div className="text-sm text-muted-foreground">
            Total: {data.ticketsPerDay?.reduce((sum, day) => sum + day.count, 0) || 0} tickets
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data.ticketsPerDay}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) =>
                new Date(d).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                })
              }
              stroke={chartColors.text}
              tickLine={false}
              axisLine={{ stroke: chartColors.grid }}
            />
            <YAxis
              allowDecimals={false}
              stroke={chartColors.text}
              tickLine={false}
              axisLine={{ stroke: chartColors.grid }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: chartColors.tooltipBg,
                border: `1px solid ${chartColors.tooltipBorder}`,
                borderRadius: "8px",
              }}
              labelFormatter={(value) => 
                new Date(value).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                })
              }
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={chartColors.primary}
              strokeWidth={3}
              dot={{ r: 5, fill: chartColors.primary, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{
                r: 8,
                stroke: chartColors.primary,
                strokeWidth: 2,
                fill: '#fff'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Section d'actions rapides */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Quick Actions */}
        <div className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <div className="w-2 h-2 bg-secondary rounded-full"></div>
            Actions Rapides
          </h2>
          <div className="space-y-4">
            <button className="w-full text-left px-6 py-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
              <div className="font-medium text-foreground">
                Nouveau Document
              </div>
              <div className="text-sm text-muted-foreground">
                Uploader un fichier important
              </div>
            </button>
            <button className="w-full text-left px-6 py-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
              <div className="font-medium text-foreground">
                Nouvelle Annonce
              </div>
              <div className="text-sm text-muted-foreground">
                Communiquer avec vos équipes
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-all duration-300">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            Activité Récente
          </h2>
          <div className="text-center py-12">
            <TrendingUpIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune activité récente
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Bouton de test des notifications push (dev uniquement) */}
      {import.meta.env.DEV && <TestPushButton />}
    </div>
  );
};

export default DashboardPage;