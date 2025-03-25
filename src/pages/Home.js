import React from 'react';
import { Link } from 'react-router-dom';
import marble from '../assets/marble.jpg';
import '../styles/Home.css'

function Home() {
    return (
        <div className="home" style={{ backgroundImage: `url(${marble})` }}>
            <div className="headerContainer" >
                <h1>Velvet Ink invitations</h1>
                <p>ELEGANT INVITATIONS FOR SPECIAL EVENTS</p>
                <Link to="/menu" style={{textDecoration: 'none'}}>
                    <button> ORDER NOW</button>
                </Link>
            </div>
        </div>
    );
}

export default Home;