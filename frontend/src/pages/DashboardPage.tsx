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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import KpiCard from "../components/KipCard";
import QuickActions from "../components/QuickActions";
import { 
  ChartPieIcon, 
  DocumentReportIcon, 
  ExclamationCircleIcon, 
  SpinnerIcon, 
  TicketIcon, 
  RestaurantIcon,
  CalendarIcon,
  CogIcon,
  TrendingUpIcon
} from "../components/icons";

interface DashboardData {
  // KPIs existants
  totalDocuments: number;
  docsThisWeek: number;
  ticketsByStatus: Record<string, number>;
  ticketsPerDay: { date: string; count: number }[];
  // Nouveaux KPIs
  totalRestaurants: number;
  auditsThisWeek: number;
  activeCorrectiveActions: number;
  auditsByStatus: Record<string, number>;
  actionsByStatus: Record<string, number>;
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
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
      .then((json: any) => setData(json.data || json))
      .catch(() => {})
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

  // Préparer les données pour les graphiques
  const auditStatusData = useMemo(() => {
    if (!data?.auditsByStatus) return [];
    
    const statusLabels = {
      'todo': 'À faire',
      'scheduled': 'Planifié',
      'in_progress': 'En cours', 
      'completed': 'Terminé',
      'reviewed': 'Vérifié',
    };

    return Object.entries(data.auditsByStatus).map(([status, count]) => ({
      name: statusLabels[status as keyof typeof statusLabels] || status,
      value: count,
      color: status === 'completed' ? chartColors.secondary : 
             status === 'in_progress' ? chartColors.warning :
             status === 'reviewed' ? chartColors.primary : '#94a3b8'
    }));
  }, [data?.auditsByStatus, chartColors]);

  const actionsStatusData = useMemo(() => {
    if (!data?.actionsByStatus) return [];
    
    const statusLabels = {
      'assigned': 'Assignée',
      'in_progress': 'En cours',
      'completed': 'Terminée', 
      'verified': 'Vérifiée',
    };

    return Object.entries(data.actionsByStatus).map(([status, count]) => ({
      name: statusLabels[status as keyof typeof statusLabels] || status,
      value: count,
    }));
  }, [data?.actionsByStatus]);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex h-64 items-center justify-center space-x-3 text-muted-foreground"
      >
        <SpinnerIcon className="h-8 w-8 animate-spin text-primary" />
        <span className="text-lg font-medium">Chargement du tableau de bord...</span>
      </motion.div>
    );
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-8"
    >
      {/* Header avec titre */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="p-3 bg-primary/10 border border-primary/20 rounded-2xl"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <ChartPieIcon className="h-7 w-7 text-primary" />
          </motion.div>
          <span>Dashboard</span>
        </h1>
      </motion.div>

      {/* Actions rapides */}
      <QuickActions />

      {/* KPIs Grid - Améliorés */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6"
      >
        <KpiCard
          title="Restaurants"
          value={data.totalRestaurants}
          icon={<RestaurantIcon />}
          index={0}
        />
        <KpiCard
          title="Audits cette semaine"
          value={data.auditsThisWeek}
          icon={<CalendarIcon />}
          index={1}
        />
        <KpiCard
          title="Actions en cours"
          value={data.activeCorrectiveActions}
          icon={<CogIcon />}
          index={2}
        />
        <KpiCard
          title="Total documents"
          value={data.totalDocuments}
          icon={<DocumentReportIcon />}
          index={3}
        />
        <KpiCard
          title="Docs cette semaine"
          value={data.docsThisWeek}
          icon={<TrendingUpIcon />}
          index={4}
        />
        <KpiCard
          title="Tickets non traités"
          value={data.ticketsByStatus?.non_traitee || 0}
          icon={<TicketIcon />}
          index={5}
        />
      </motion.div>

      {/* Graphiques - Section 1 : Audits et Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique Audits par statut */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-all duration-300"
        >
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Statut des audits
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={auditStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {auditStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Graphique Actions correctives */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-all duration-300"
        >
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Actions correctives
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={actionsStatusData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis 
                dataKey="name"
                stroke={chartColors.text}
                tickLine={false}
                axisLine={{ stroke: chartColors.grid }}
                fontSize={12}
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
              />
              <Bar 
                dataKey="value" 
                fill={chartColors.secondary}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

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
    </motion.div>
  );
};

export default DashboardPage;
