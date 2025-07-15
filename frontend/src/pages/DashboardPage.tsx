// src/pages/DashboardPage.tsx
import { useEffect, useState, useMemo } from "react";
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
import KpiCard from "../components/KipCard"; // Le fichier s'appelle KipCard mais exporte KpiCard
import { ChartPieIcon, DocumentReportIcon, ExclamationCircleIcon, SpinnerIcon, ClockIcon, TicketIcon } from "../components/icons";

interface DashboardData {
  totalDocuments: number;
  docsThisWeek: number;
  ticketsByStatus: Record<string, number>;
  ticketsPerDay: { date: string; count: number }[];
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

  // Récupération des couleurs du thème pour le graphique
  const chartColors = useMemo(() => {
    const getCssVar = (name: string) => {
      if (typeof window === "undefined") return "";
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    };

    return {
      grid: `hsl(${getCssVar("--border")})`,
      text: `hsl(${getCssVar("--muted-foreground")})`,
      line: `hsl(${getCssVar("--primary")})`,
      tooltipBg: `hsl(${getCssVar("--popover")})`,
      tooltipBorder: `hsl(${getCssVar("--border")})`,
      tooltipText: `hsl(${getCssVar("--popover-foreground")})`,
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center space-x-2 text-muted-foreground">
        <SpinnerIcon className="h-6 w-6 animate-spin" />
        <span>Chargement du tableau de bord...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center space-x-3 m-6">
        <ExclamationCircleIcon className="h-6 w-6" />
        <span className="font-medium">
          Erreur : Impossible de charger les données du tableau de bord.
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
        <div className="p-2 bg-card border border-border rounded-lg">
          <ChartPieIcon className="h-6 w-6 text-primary" />
        </div>
        <span>Tableau de bord</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total documents"
          value={data.totalDocuments}
          icon={<DocumentReportIcon />}
        />
        <KpiCard
          title="Docs cette semaine"
          value={data.docsThisWeek}
          icon={<ClockIcon />}
        />
        {data.ticketsByStatus && Object.entries(data.ticketsByStatus).map(([status, count]) => {
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
            />
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-card-foreground mb-6">
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
      </div>
    </div>
  );
};

export default DashboardPage;
