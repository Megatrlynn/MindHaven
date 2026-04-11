import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Activity, HelpCircle, Star } from 'lucide-react';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Define types for the data and chart
interface OverviewData {
  date: string;
  signUps: number;
  questions: number;
  reviews: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }[];
}

const StatisticsChart = ({ data }: { data: OverviewData[] }) => {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  });

  const [chartType, setChartType] = useState<'signUps' | 'questions' | 'reviews'>('signUps'); 

  // Prepare data for the chart
  const prepareChartData = (dataType: 'signUps' | 'questions' | 'reviews'): ChartData => {
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const labels = sortedData.map(item => item.date);

    let values: number[];
    switch (dataType) {
      case 'signUps':
        values = sortedData.map(item => item.signUps);
        break;
      case 'questions':
        values = sortedData.map(item => item.questions);
        break;
      case 'reviews':
        values = sortedData.map(item => item.reviews);
        break;
      default:
        values = sortedData.map(item => item.signUps);
    }

    const palette =
      dataType === 'signUps'
        ? { border: 'rgb(14, 116, 144)', background: 'rgba(14, 116, 144, 0.18)' }
        : dataType === 'questions'
          ? { border: 'rgb(5, 150, 105)', background: 'rgba(5, 150, 105, 0.18)' }
          : { border: 'rgb(217, 119, 6)', background: 'rgba(217, 119, 6, 0.2)' };

    return {
      labels,
      datasets: [
        {
          label: `${dataType} Over Time`,
          data: values,
          borderColor: palette.border,
          backgroundColor: palette.background,
          tension: 0.4,
        },
      ],
    };
  };

  // Update chart data when the chartType or data changes
  useEffect(() => {
    setChartData(prepareChartData(chartType));
  }, [chartType, data]);

  return (
    <div className="mb-2 w-full p-1">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              chartType === 'signUps'
                ? 'bg-cyan-700 text-white'
                : 'bg-[var(--mh-surface-soft)] text-[var(--mh-text-muted)] hover:bg-[var(--mh-surface)]'
            }`}
            onClick={() => setChartType('signUps')}
          >
            <Activity className="h-4 w-4" />
            Sign-Ups
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              chartType === 'questions'
                ? 'bg-emerald-600 text-white'
                : 'bg-[var(--mh-surface-soft)] text-[var(--mh-text-muted)] hover:bg-[var(--mh-surface)]'
            }`}
            onClick={() => setChartType('questions')}
          >
            <HelpCircle className="h-4 w-4" />
            Questions
          </button>
          <button
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
              chartType === 'reviews'
                ? 'bg-amber-500 text-white'
                : 'bg-[var(--mh-surface-soft)] text-[var(--mh-text-muted)] hover:bg-[var(--mh-surface)]'
            }`}
            onClick={() => setChartType('reviews')}
          >
            <Star className="h-4 w-4" />
            Reviews
          </button>
        </div>
      </div>

      {/* Render Chart */}
      <div className="h-[360px] w-full">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => {
                    const numValue = Number(value);
                    return numValue % 1 === 0 ? numValue : '';
                  },
                  stepSize: 1,
                },
                min: 0,
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default StatisticsChart;


