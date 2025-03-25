import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/InvitationDetail.css"

function InvitationDetail() {
    const location = useLocation();
    const navigate = useNavigate();
    const { invitation } = location.state;

    const handlePersonalize = () => {
        navigate('/personalize-invitation', {state: invitation });
    }

    return (
        <div className="invitationDetail">
            <button className="personalizeButton" onClick={handlePersonalize}>Personalize</button>
            <h1>{invitation.name}</h1>
            <img src={invitation.image} alt={invitation.name}/>
            <h3>Event Type: {invitation.eventType}</h3>
            <p>Price: ${invitation.price}</p>
            <p><strong>Details:</strong> {invitation.details}</p>
        </div>
    );
}

export default InvitationDetail;
