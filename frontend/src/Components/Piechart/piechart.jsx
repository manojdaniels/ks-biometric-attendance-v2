import React from 'react';
import "./piechart.css";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ labels, values, colors, title }) => {
  const data = {
    labels: labels,
    datasets: [
      {
        label: title || 'Chart Data',
        data: values,
        backgroundColor: colors || ['#4CAF50', '#F44336'], // Optional: custom colors
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  return (
    <div className="pie-css">
      <Pie data={data} options={options} />
    </div>
  );
};

export default PieChart;
