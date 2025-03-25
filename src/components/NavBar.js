import React, { useState } from 'react';
import llogo from '../assets/llogo.png';
import { Link } from 'react-router-dom';
import "../styles/NavBar.css";
import ReorderIcon from "@mui/icons-material/Reorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

function NavBar() {
    const [openLinks, setOpenLinks] = useState(false);

    const toggleNavBar = () => {
        setOpenLinks(!openLinks);
    }

    return (
        <div className="navbar">
            <div className="leftSide" id={openLinks ? "open" : "close"}>
                <img src={llogo} />
                <div className="hiddenLinks">
                    <Link to="/"> Home </Link>
                    <Link to="/about"> About </Link>
                    <Link to="/contact"> Contact </Link>
                    <Link to="/menu"> Invitations </Link>
                </div>
            </div>
            <div className="rightSide">
                <Link to="/"> Home </Link>
                <Link to="/about"> About </Link>
                <Link to="/contact"> Contact </Link>
                <Link to="/menu"> Invitations </Link>
                <Link to="/cart" className="cart-icon"> <ShoppingCartIcon /></Link>
                <button onClick={toggleNavBar}>
                    <ReorderIcon />
                </button>


            </div>


        </div>
    )
}

export default NavBar;