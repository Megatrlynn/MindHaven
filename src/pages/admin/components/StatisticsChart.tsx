import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

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

    return {
      labels,
      datasets: [
        {
          label: `${dataType} Over Time`,
          data: values,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
    <div className="w-full max-h-[700px] p-6 mb-10">
      <div className="flex justify-between items-center mb-4">
        <div>
          <button
            className={`px-6 py-3 mr-4 mt-2 rounded-[50px] transition-all duration-300 ease-in-out ${
              chartType === 'signUps'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-800 hover:bg-blue-600 hover:text-white'
            }`}
            onClick={() => setChartType('signUps')}
          >
            Sign-Ups
          </button>
          <button
            className={`px-6 py-3 mr-4 mt-2 rounded-[50px] transition-all duration-300 ease-in-out ${
              chartType === 'questions'
                ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-800 hover:bg-green-600 hover:text-white'
            }`}
            onClick={() => setChartType('questions')}
          >
            Questions
          </button>
          <button
            className={`px-6 py-3 mt-2 rounded-[50px] transition-all duration-300 ease-in-out ${
              chartType === 'reviews'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-800 hover:bg-yellow-600 hover:text-white'
            }`}
            onClick={() => setChartType('reviews')}
          >
            Reviews
          </button>
        </div>
      </div>

      {/* Render Chart */}
      <Line
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              ticks: {
                callback: (value) => {
                  const numValue = Number(value);
                  return numValue % 1 === 0 ? numValue : '';
                },
                stepSize: 1, 
              },
              min: Math.min(...chartData.datasets[0].data) - 1,
              max: Math.max(...chartData.datasets[0].data) + 1,
            },
          },
        }}
      />
    </div>
  );
};

export default StatisticsChart;
