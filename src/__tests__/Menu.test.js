import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import Menu from '../pages/Menu';
import '@testing-library/jest-dom';

jest.mock('../helpers/MenuList', () => ({
    MenuList: [
        { name: 'A Invite', price: 1.0, eventType: 'wedding', image: '', details: '' },
        { name: 'B Invite', price: 2.0, eventType: 'birthday', image: '', details: '' },
        { name: 'C Invite', price: 0.5, eventType: 'graduation', image: '', details: '' },
    ],
}));

jest.mock('../components/Charts', () => () => <div data-testid="mock-charts" />);
jest.mock('../components/MenuItem', () => ({ name, price, highlightType }) => (
    <div data-testid={`menu-item-${highlightType}`}>
        <h1>{name}</h1>
        <p>${price}</p>
    </div>
));

describe('Menu Component', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('renders initial menu items', async () => {
        render(<Menu />);
        const items = await screen.findAllByTestId(/menu-item-/);
        expect(items).toHaveLength(3);
    });


    test('filters by max price', async () => {
        render(<Menu />);
        fireEvent.change(screen.getByPlaceholderText(/max price/i), { target: { value: '1' } });
        const prices = await screen.findAllByText(/\$\d+(\.\d+)?/);
        prices.forEach(p => {
            expect(parseFloat(p.textContent.replace('$', ''))).toBeLessThanOrEqual(1);
        });
    });

    test('adds fake invitations on interval', async () => {
        render(<Menu />);
        const toggle = screen.getByRole('button', { name: /start adding/i });
        const initial = await screen.findAllByTestId(/menu-item-/);
        fireEvent.click(toggle);

        await act(async () => {
            jest.advanceTimersByTime(2100);
            await Promise.resolve();
        });

        const after = screen.getAllByTestId(/menu-item-/);
        expect(after.length).toBeGreaterThan(initial.length);
    });

    test('pauses fake invitations when toggled again', async () => {
        render(<Menu />);
        fireEvent.click(screen.getByText(/start adding/i));

        await act(async () => {
            jest.advanceTimersByTime(2100);
            await Promise.resolve();
        });

        fireEvent.click(screen.getByText(/pause adding/i));

        await act(async () => {
            jest.advanceTimersByTime(4000);
            await Promise.resolve();
        });

        const paused = screen.getAllByTestId(/menu-item-/);
        expect(paused.length).toBeLessThanOrEqual(4);
    });

    test('removes all fake invitations', async () => {
        render(<Menu />);
        fireEvent.click(screen.getByText(/start adding/i));

        await act(async () => {
            jest.advanceTimersByTime(4100);
            await Promise.resolve();
        });

        fireEvent.click(screen.getByText(/remove all fake/i));
        const reset = screen.getAllByTestId(/menu-item-/);
        expect(reset).toHaveLength(3);
    });

    test('renders charts component', () => {
        render(<Menu />);
        expect(screen.getByTestId('mock-charts')).toBeInTheDocument();
    });

    test('pagination works when more than 6 items', async () => {
        render(<Menu />);
        fireEvent.click(screen.getByText(/start adding/i));

        await act(async () => {
            jest.advanceTimersByTime(12000);
            await Promise.resolve();
        });

        expect(screen.getByText(/next/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: '2' }));
        expect(screen.getByRole('button', { name: '2' })).toHaveClass('active-page');
    });
});
