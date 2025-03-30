import React from 'react';
import { useNavigate } from 'react-router-dom';

function MenuItem({ image, name, eventType, price, details, highlightType }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/invitation-detail', {
            state: { invitation: { name, image, eventType, price, details } }
        });
    };

    let labelText = 'Average Priced';
    if (highlightType === 'min') labelText = 'Least Expensive';
    if (highlightType === 'max') labelText = 'Most Expensive';

    return (
        <div className="menuItem">
            <div className="imageContainer" style={{ backgroundImage: `url(${image})` }}>
            </div>

            <h1>{name}</h1>
            <h3>{eventType}</h3>

            <p className="item-price">
                ${price}
                <span className={`price-badge badge-${highlightType}`}>
          {labelText}
        </span>
            </p>

            <button className="plusButton" onClick={handleClick}>
                +
            </button>
        </div>
    );
}

export default MenuItem;
