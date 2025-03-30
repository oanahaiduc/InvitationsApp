import React, { useEffect, useState } from 'react';
import 'chart.js/auto';
import { Bar, Pie } from 'react-chartjs-2';
import '../styles/Charts.css';

function Charts({ items = [], totalReal = 0 }) {
    const [priceVsNameData, setPriceVsNameData] = useState({ labels: [], datasets: [] });
    const [eventDistributionData, setEventDistributionData] = useState({ labels: [], datasets: [] });
    const [avgPricePerEventType, setAvgPricePerEventType] = useState({ labels: [], datasets: [] });

    useEffect(() => {
        const names = items.map(item => item.name);
        const prices = items.map(item => item.price);

        setPriceVsNameData({
            labels: names,
            datasets: [
                {
                    label: 'Price ($)',
                    data: prices,
                    backgroundColor: 'rgba(54,162,235,0.6)',
                }
            ]
        });
    }, [items]);

    useEffect(() => {
        const counts = {};
        items.forEach(item => {
            counts[item.eventType] = (counts[item.eventType] || 0) + 1;
        });

        setEventDistributionData({
            labels: Object.keys(counts),
            datasets: [
                {
                    label: 'Event Types',
                    data: Object.values(counts),
                    backgroundColor: [
                        'rgba(255,99,132,0.6)',
                        'rgba(54,162,235,0.6)',
                        'rgba(255,206,86,0.6)',
                        'rgba(75,192,192,0.6)',
                    ]
                }
            ]
        });
    }, [items]);

    useEffect(() => {
        const totalPricePerType = {};
        const countPerType = {};

        items.forEach(item => {
            const type = item.eventType;
            totalPricePerType[type] = (totalPricePerType[type] || 0) + item.price;
            countPerType[type] = (countPerType[type] || 0) + 1;
        });

        const labels = Object.keys(totalPricePerType);
        const avgPrices = labels.map(label => (totalPricePerType[label] / countPerType[label]).toFixed(2));

        setAvgPricePerEventType({
            labels,
            datasets: [
                {
                    label: 'Average Price ($)',
                    data: avgPrices,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                }
            ]
        });
    }, [items]);

    return (
        <div className="charts-container">
            <h2 className="charts-title">Invitation Analytics</h2>

            <div className="chart-wrapper">
                <h3>Price vs. Name</h3>
                <div className="chart"><Bar data={priceVsNameData} /></div>
            </div>

            <div className="chart-wrapper">
                <h3>Event Type Distribution</h3>
                <div className="chart"><Pie data={eventDistributionData} /></div>
            </div>

            <div className="chart-wrapper">
                <h3>Average Price per Event Type</h3>
                <div className="chart"><Bar data={avgPricePerEventType} /></div>
            </div>
        </div>
    );
}

export default Charts;
