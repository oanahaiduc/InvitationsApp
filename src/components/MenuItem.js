import React from 'react';
import { useNavigate } from 'react-router-dom';

function MenuItem({ image, name, eventType, price, details, highlightType }) {
    const navigate = useNavigate();

    const imageUrl = image.startsWith('http') ? image : `http://localhost:5000/assets/${image}`;

    console.log('RAW image value:', image);
    console.log('Constructed imageUrl:', imageUrl);

    const handleClick = () => {
        navigate('/invitation-detail', {
            state: { invitation: { name, image: imageUrl, eventType, price, details } }
        });
    };

    let labelText = 'Average Priced';
    if (highlightType === 'min') labelText = 'Least Expensive';
    if (highlightType === 'max') labelText = 'Most Expensive';

    return (
        <div className="menuItem">
            <div className="imageContainer" style={{ backgroundImage: `url(${imageUrl})` }}>
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