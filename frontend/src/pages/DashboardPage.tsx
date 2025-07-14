// src/pages/DashboardPage.tsx
import React, { useEffect, useState, useMemo } from "react";
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

// --- ICÔNES SVG ---
const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const DocumentReportIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);
const TicketIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 6H3.75A2.25 2.25 0 001.5 8.25v8.25A2.25 2.25 0 003.75 18z"
    />
  </svg>
);
const ChartPieIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
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
const ExclamationCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);
const SpinnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      fill="currentColor"
    />
  </svg>
);
// --- FIN ICÔNES SVG ---

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
      .catch((err) => {})
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
        {data.ticketsByStatus && Object.entries(data.ticketsByStatus).map(([status, count]) => (
          <KpiCard
            key={status}
            title={`Tickets ${status.replace("_", " ")}`}
            value={count}
            icon={<TicketIcon />}
          />
        ))}
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
