// src/pages/DashboardPage.tsx
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KpiCard from "../components/KipCard"; // Le fichier s'appelle KipCard mais exporte KpiCard
import { ChartPieIcon, DocumentReportIcon, ExclamationCircleIcon, SpinnerIcon, ClockIcon, TicketIcon, ArchiveIcon } from "../components/icons";

interface DashboardData {
  totalDocuments: number;
  docsThisWeek: number;
  ticketsByStatus: Record<string, number>;
  ticketsPerDay: { date: string; count: number }[];
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();
  const navigate = useNavigate();

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

  // Couleurs Waitify pour le graphique
  const chartColors = useMemo(() => {
    return {
      grid: "#e5e7eb",
      text: "#6b7280",
      line: "#2563eb",
      tooltipBg: "#ffffff",
      tooltipBorder: "#e5e7eb",
      tooltipText: "#1f2937",
    };
  }, []);

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
          <span>Tableau de bord</span>
        </h1>
        
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <KpiCard
          title="Total documents"
          value={data.totalDocuments}
          icon={<DocumentReportIcon />}
          index={0}
        />
        <KpiCard
          title="Docs cette semaine"
          value={data.docsThisWeek}
          icon={<ClockIcon />}
          index={1}
        />
        {data.ticketsByStatus && Object.entries(data.ticketsByStatus).map(([status, count], index) => {
          const statusLabels = {
            'non_traitee': 'non traités',
            'en_cours': 'en cours',
            'traitee': 'traités',
            'supprime': 'supprimés'
          };
          return (
            <KpiCard
              key={status}
              title={`Tickets ${statusLabels[status as keyof typeof statusLabels] || status}`}
              value={count}
              icon={<TicketIcon />}
              index={index + 2}
            />
          );
        })}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-all duration-300"
      >
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          Tickets créés (7 derniers jours)
        </h2>
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
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: chartColors.tooltipText }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={chartColors.line}
              strokeWidth={2}
              dot={{ r: 4, fill: chartColors.line }}
              activeDot={{
                r: 8,
                stroke: chartColors.tooltipBg,
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;
