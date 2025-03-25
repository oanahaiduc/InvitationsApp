import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../helpers/CartProvider";
import "../styles/Cart.css";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

function Cart() {
    const { cart, removeFromCart } = useContext(CartContext);
    const navigate = useNavigate();

    const totalPrice = cart.reduce((total, item) => total + item.totalPrice, 0);

    return (
        <div className="cart-container">
            <h2>Your Cart</h2>

            {cart.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <div>
                    {cart.map((item, index) => (
                        <div key={index} className="cart-item">
                            <img src={item.image} alt={item.name} />
                            <div className="cart-details">
                                {/* Invitation Name */}
                                <h3>{item.name}</h3>

                                {/* Celebrant Name (Separate Line) */}
                                <p><strong>Celebrant:</strong> {item.celebrantName}</p>

                                <p><strong>Event Type:</strong> {item.eventType}</p>
                                <p><strong>Location:</strong> {item.eventLocation}</p>
                                <p><strong>Quantity:</strong> {item.quantity}</p>
                                <p><strong>Total Price:</strong> ${item.totalPrice.toFixed(2)}</p>

                                <div className = "cart-actions">
                                <button className="edit-button" onClick={() => navigate("/personalize-invitation", { state: item })}>
                                    <EditIcon fontSize="small" />
                                </button>

                                <button className="delete-button" onClick={() => removeFromCart(index)}>
                                    <DeleteIcon fontSize="small" />
                                </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <h3>Total Price: ${totalPrice.toFixed(2)}</h3>
                </div>
            )}
        </div>
    );
}

export default Cart;
