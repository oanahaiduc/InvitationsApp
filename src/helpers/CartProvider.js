import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const storedCart = localStorage.getItem("cart");
        return storedCart ? JSON.parse(storedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (invitation) => {
        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex((item) => item.id === invitation.id);

            if (existingIndex !== -1) {
                const updatedCart = [...prevCart];
                updatedCart[existingIndex] = invitation;
                return updatedCart;
            } else {
                return [...prevCart, { ...invitation, id: new Date().getTime() }];
            }
        });
    };

    const removeFromCart = (index) => {
        setCart((prevCart) => prevCart.filter((_, i) => i !== index));
    };

    const editInvitation = (invitation, navigate) => {
        navigate("/personalize-invitation", { state: invitation });
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, editInvitation }}>
            {children}
        </CartContext.Provider>
    );
};
