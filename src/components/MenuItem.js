import React from 'react';
import { useNavigate } from 'react-router-dom';

function MenuItem({ image, name, eventType, price, details }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/invitation-detail', {
            state: { invitation: {name, image, eventType, price, details} }
        });
    };

    return (
        <div className="menuItem">
            <div style={{backgroundImage: `url(${image})`}}>
            </div>
            <h1> {name} </h1>
            <h3> {eventType}</h3>
            <p> ${price} </p>
            <button className="plusButton" onClick={handleClick}>+</button>


        </div>
    );
}

export default MenuItem;