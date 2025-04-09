import React, { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Personalize.css";
import { CartContext } from "../helpers/CartProvider";

function Personalize() {
    const location = useLocation();
    const invitation = location.state || {};
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);

    const [formData, setFormData] = useState({
        celebrantName: "",
        date: "",
        location: "",
        text: "",
        quantity: "",
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        let newErrors = {};

        if (!formData.celebrantName.trim()) newErrors.celebrantName = "Celebrant name is required.";
        if (!formData.date) newErrors.date = "Date is required.";
        else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) newErrors.date = "Enter a valid date (YYYY-MM-DD).";

        if (!formData.location.trim()) newErrors.location = "Location is required.";
        if (!formData.text.trim()) newErrors.text = "Text is required.";
        if (!formData.quantity) newErrors.quantity = "Quantity is required.";
        else if (isNaN(formData.quantity) || formData.quantity < 1) newErrors.quantity = "Enter a valid number (min 1).";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const personalizedInvitation = {
                ...invitation,
                celebrantName: formData.celebrantName,
                eventDate: formData.date,
                eventLocation: formData.location,
                customText: formData.text,
                quantity: parseInt(formData.quantity),
                totalPrice: invitation.price * parseInt(formData.quantity),
            };

            addToCart(personalizedInvitation);
            navigate("/cart");
        }
    };

    return (
        <div className="personalize-container">
            <div className="invitation-preview">
                <h2>{invitation.name}</h2>
                <img src={invitation.image} alt={invitation.name} />
                <p><strong>Event Type:</strong> {invitation.eventType}</p>
                <p><strong>Price:</strong> ${invitation.price}</p>
            </div>

            <div className="personalization-form">
                <h2>Personalize Your Invitation</h2>
                <form onSubmit={handleSubmit}>
                    <label>Celebrant Name(s):</label>
                    <input
                        type="text"
                        name="celebrantName"
                        value={formData.celebrantName}
                        onChange={handleChange}
                    />
                    {errors.celebrantName && <p className="error">{errors.celebrantName}</p>}

                    <label>Date:</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                    />
                    {errors.date && <p className="error">{errors.date}</p>}

                    <label>Location:</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                    />
                    {errors.location && <p className="error">{errors.location}</p>}

                    <label>Custom Text:</label>
                    <textarea
                        name="text"
                        value={formData.text}
                        onChange={handleChange}
                    ></textarea>
                    {errors.text && <p className="error">{errors.text}</p>}

                    <label>Number of Invitations:</label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                    />
                    {errors.quantity && <p className="error">{errors.quantity}</p>}

                    <button type="submit">Add to Cart</button>
                </form>
            </div>
        </div>
    );
}

export default Personalize;
