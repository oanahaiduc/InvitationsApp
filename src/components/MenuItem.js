import React from 'react';
import { useNavigate } from 'react-router-dom';

function MenuItem({ image, name, eventType, Category, price, details, highlightType }) {
    const navigate = useNavigate();

    const imageUrl = image.startsWith('http')
        ? image
        : `${window.location.protocol}//${window.location.hostname}:5000/assets/${image}`;

    const handleClick = () => {
        navigate('/invitation-detail', {
            state: {
                invitation: {
                    name,
                    image: imageUrl,
                    eventType: Category?.name || eventType,
                    price,
                    details
                }
            }
        });
    };

    let labelText = 'Average Priced';
    if (highlightType === 'min') labelText = 'Least Expensive';
    if (highlightType === 'max') labelText = 'Most Expensive';

    return (
        <div className="menuItem">
            <div className="imageContainer" style={{ backgroundImage: `url(${imageUrl})` }} />
            <h1>{name}</h1>
            <h3>{Category?.name || eventType}</h3> {/* ← This line updated */}
            <p className="item-price">
                ${price}
                <span className={`price-badge badge-${highlightType}`}>
                    {labelText}
                </span>
            </p>
            <button className="plusButton" onClick={handleClick}>+</button>
        </div>
    );
}

export default MenuItem;