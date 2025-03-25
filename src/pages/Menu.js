import React, { useState, useEffect } from 'react';
import { MenuList } from '../helpers/MenuList';
import MenuItem from '../components/MenuItem';
import "../styles/Menu.css";

function Menu() {
    const [sortInvitations, setSortInvitations] = useState('price-asc');
    const [maxPrice, setMaxPrice] = useState('');
    const [filteredList, setFilteredList] = useState([...MenuList]);

    const updateMenuList = () => {
        let updatedList = [...MenuList];

        // Filter by max price
        if (maxPrice !== "") {
            updatedList = updatedList.filter(item => item.price <= parseFloat(maxPrice));
        }

        // Sorting logic
        updatedList.sort((a, b) => {
            if (sortInvitations === "price-asc") return a.price - b.price;
            if (sortInvitations === "price-desc") return b.price - a.price;
            if (sortInvitations === "name-asc") return a.name.localeCompare(b.name);
            if (sortInvitations === "name-desc") return b.name.localeCompare(a.name);
            return 0;
        });

        setFilteredList(updatedList);
    };

    useEffect(() => {
        updateMenuList();
    }, [sortInvitations, maxPrice]);

    return (
        <div className="menu">
            <h1 className="menuTitle">Our Invitations</h1>

            {/* Sorting & Filtering Controls */}
            <div className="controls">
                <label>Sort by:</label>
                <select value={sortInvitations} onChange={(e) => setSortInvitations(e.target.value)}>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                </select>

                <label htmlFor="maxPrice">Filter by Max Price:</label>
                <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Enter max price"
                />
            </div>

            {/* Menu List */}
            <div className="menuList">
                {filteredList.map((menuItem, key) => (
                    <MenuItem
                        key={key}
                        image={menuItem.image}
                        name={menuItem.name}
                        eventType={menuItem.eventType}
                        price={menuItem.price}
                        invitation={menuItem}
                        details={menuItem.details}
                    />
                ))}
            </div>
        </div>
    );
}

export default Menu;
