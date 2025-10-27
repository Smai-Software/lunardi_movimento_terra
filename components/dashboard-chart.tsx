"use client";

import type { ApexOptions } from "apexcharts";
import {
  eachDayOfInterval,
  format,
  isAfter,
  isEqual,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { it } from "date-fns/locale";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type Attivita = {
  id: number;
  date: Date | string;
};

type Intervallo = "7" | "15" | "30";

type DashboardChartProps = {
  attivita: Attivita[];
  interval?: Intervallo;
};

export default function DashboardChart({
  attivita,
  interval = "30",
}: DashboardChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const intervalDays = parseInt(interval, 10);
    const startDate = startOfDay(subDays(now, intervalDays - 1));
    const endDate = startOfDay(now);

    const allDatesInInterval = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    const relevantAttivita = attivita.filter((attivitaItem) => {
      const attivitaDate =
        typeof attivitaItem.date === "string"
          ? parseISO(attivitaItem.date)
          : new Date(attivitaItem.date);
      const startOfAttivitaDay = startOfDay(attivitaDate);
      return (
        (isAfter(startOfAttivitaDay, startDate) ||
          isEqual(startOfAttivitaDay, startDate)) &&
        !isAfter(startOfAttivitaDay, endDate)
      );
    });

    const attivitaByDay = relevantAttivita.reduce(
      (acc, attivitaItem) => {
        const attivitaDate =
          typeof attivitaItem.date === "string"
            ? parseISO(attivitaItem.date)
            : new Date(attivitaItem.date);
        const dayKey = format(startOfDay(attivitaDate), "yyyy-MM-dd");
        acc[dayKey] = (acc[dayKey] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const categories = allDatesInInterval.map((date) =>
      format(date, "dd MMM", { locale: it }),
    );
    const seriesData = allDatesInInterval.map((date) => {
      const dayKey = format(date, "yyyy-MM-dd");
      return attivitaByDay[dayKey] || 0;
    });

    return {
      series: [{ name: "Attività", data: seriesData }],
      categories: categories,
    };
  }, [attivita, interval]);

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories: chartData.categories,
        labels: {
          rotate: -45,
          style: {
            fontSize: "10px",
          },
        },
      },
      yaxis: {
        title: {
          text: "Numero di Attività",
        },
        labels: {
          formatter: (val) => val.toFixed(0),
        },
        min: 0,
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: (val) => `${val} attività`,
        },
      },
      noData: {
        text: "Nessuna attività nel periodo selezionato.",
        align: "center",
        verticalAlign: "middle",
        offsetX: 0,
        offsetY: 0,
        style: {
          fontSize: "14px",
        },
      },
    }),
    [chartData.categories],
  );

  return (
    <div className="card bg-base-100 shadow-md mt-2">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-lg font-semibold">Attività Recenti</h2>
        </div>
        <p>
          Totale:{" "}
          {chartData.series[0].data.reduce((acc, curr) => acc + curr, 0)}
        </p>

        <div id="chart">
          <ReactApexChart
            options={chartOptions}
            series={chartData.series}
            type="bar"
            height={350}
          />
        </div>
      </div>
    </div>
  );
}
