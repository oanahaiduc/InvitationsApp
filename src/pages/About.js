import React from 'react';
import balloons from "../assets/balloons.jpeg";
import "../styles/About.css"

function About() {
    return (
        <div className="about" >
            <div className="aboutTop" style={{ backgroundImage: `url(${balloons})` }}></div>
            <div className="aboutBottom">
                <h1>ABOUT US</h1>
                <p>
                    We love to celebrate and we are Velvet Ink, here to offer you<br/>
                    the most beautiful invitations designs, fast delivery and premium <br/>
                    services. Feel free to explore our creations!<br/>
                </p>
            </div>
        </div>
    );
}

export default About;