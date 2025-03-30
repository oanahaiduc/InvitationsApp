import React from 'react';
import { render, screen } from '@testing-library/react';
import Charts from '../components/Charts';

jest.mock('react-chartjs-2', () => ({
    Bar: () => <div data-testid="bar-chart" />,
    Pie: () => <div data-testid="pie-chart" />
}));

const mockItems = [
    { name: 'Invite A', price: 100, eventType: 'Wedding' },
    { name: 'Invite B', price: 150, eventType: 'Birthday' },
    { name: 'Invite C', price: 200, eventType: 'Wedding' },
];

describe('Charts Component', () => {
    it('renders the main title', () => {
        render(<Charts items={mockItems} totalReal={450} />);
        expect(screen.getByText(/Invitation Analytics/i)).toBeInTheDocument();
    });

    it('renders chart sections', () => {
        render(<Charts items={mockItems} />);
        expect(screen.getByText(/Price vs. Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Event Type Distribution/i)).toBeInTheDocument();
        expect(screen.getByText(/Average Price per Event Type/i)).toBeInTheDocument();
    });

    it('renders mock charts in DOM', () => {
        render(<Charts items={mockItems} />);
        expect(screen.getAllByTestId('bar-chart')).toHaveLength(2);
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
});
