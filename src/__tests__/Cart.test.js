import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Cart from '../pages/Cart';
import { CartContext } from '../helpers/CartProvider';
import '@testing-library/jest-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    MemoryRouter: ({ children }) => <div>{children}</div>,
}));

describe('Cart Component – CRUD Operations', () => {
    const mockRemoveFromCart = jest.fn();

    const sampleCart = [
        {
            id: 1,
            name: 'Birthday Invite',
            image: 'img.jpg',
            celebrantName: 'Alice',
            eventType: 'birthday',
            eventLocation: 'Wonderland',
            quantity: 5,
            totalPrice: 15,
        },
    ];

    const renderCart = (cart = sampleCart) => {
        render(
            <CartContext.Provider value={{ cart, removeFromCart: mockRemoveFromCart }}>
                <Cart />
            </CartContext.Provider>
        );
    };

    test('displays empty state when cart is empty', () => {
        renderCart([]);
        expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });


    test('displays total price at bottom', () => {
        renderCart();
        expect(screen.getByText(/Total Price: \$15.00/i)).toBeInTheDocument();
    });

    test('calls navigate on edit button click', () => {
        renderCart();
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]);
        expect(mockNavigate).toHaveBeenCalledWith('/personalize-invitation', {
            state: sampleCart[0],
        });
    });

    test('calls removeFromCart on delete button click', () => {
        renderCart();
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[1]);
        expect(mockRemoveFromCart).toHaveBeenCalledWith(0);
    });
});