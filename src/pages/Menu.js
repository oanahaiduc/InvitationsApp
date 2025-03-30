import React, { useState, useEffect, useRef } from 'react';
import { MenuList } from '../helpers/MenuList';
import MenuItem from '../components/MenuItem';
import Charts from '../components/Charts';
import { faker } from '@faker-js/faker';
import { act } from 'react';
import "../styles/Menu.css";

function Menu() {
    const [sortInvitations, setSortInvitations] = useState('price-asc');
    const [maxPrice, setMaxPrice] = useState('');
    const [filteredList, setFilteredList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [fakeInvitations, setFakeInvitations] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    const intervalRef = useRef(null);

    const combinedList = [...MenuList, ...fakeInvitations];

    useEffect(() => {
        let updatedList = [...combinedList];

        if (maxPrice !== '') {
            updatedList = updatedList.filter(item => item.price <= parseFloat(maxPrice));
        }

        updatedList.sort((a, b) => {
            if (sortInvitations === "price-asc") return a.price - b.price;
            if (sortInvitations === "price-desc") return b.price - a.price;
            if (sortInvitations === "name-asc") return a.name.localeCompare(b.name);
            if (sortInvitations === "name-desc") return b.name.localeCompare(a.name);
            return 0;
        });

        setFilteredList(updatedList);
    }, [sortInvitations, maxPrice, fakeInvitations]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredList, itemsPerPage]);

    const minPrice = Math.min(...filteredList.map(i => i.price));
    const maxPriceVal = Math.max(...filteredList.map(i => i.price));
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredList.slice(startIndex, endIndex);

    const generateFakeInvitation = () => ({
        name: faker.commerce.productName(),
        eventType: faker.helpers.arrayElement(["birthday", "wedding", "graduation", "cocktail party"]),
        price: parseFloat(faker.commerce.price({ min: 0.5, max: 4.99 })),
        image: 'https://via.placeholder.com/300x200.png?text=Fake+Invite',
        details: faker.commerce.productDescription()
    });

    const toggleFakeAdding = () => {
        if (isAdding) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsAdding(false);
        } else {
            intervalRef.current = setInterval(() => {
                if (process.env.NODE_ENV === 'test') {
                    act(() => {
                        setFakeInvitations(prev => [...prev, generateFakeInvitation()]);
                    });
                } else {
                    setFakeInvitations(prev => [...prev, generateFakeInvitation()]);
                }
            }, 2000);
            setIsAdding(true);
        }
    };

    const removeFakes = () => {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsAdding(false);
        setFakeInvitations([]);
    };

    return (
        <div className="menu">
            <h1 className="menuTitle">Our Invitations</h1>

            <div className="controls">
                <label>Sort by:</label>
                <select value={sortInvitations} onChange={(e) => setSortInvitations(e.target.value)}>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                </select>

                <label>Max Price:</label>
                <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Enter max price"
                />

                <label>Items per page:</label>
                <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={6}>6</option>
                </select>
            </div>

            <div className="menuList">
                {currentItems.map((item, i) => {
                    let highlightType = 'avg';
                    if (item.price === minPrice) highlightType = 'min';
                    if (item.price === maxPriceVal) highlightType = 'max';

                    return <MenuItem key={i} {...item} highlightType={highlightType} />;
                })}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            className={page === currentPage ? 'active-page' : ''}
                            onClick={() => setCurrentPage(page)}
                        >
                            {page}
                        </button>
                    ))}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                </div>
            )}

            <div className="faker-controls">
                <h2>Test Real-Time Chart Updates</h2>
                <button onClick={toggleFakeAdding}>
                    {isAdding ? "Pause Adding Fake Invitations" : "Start Adding Fake Invitations"}
                </button>
                <button onClick={removeFakes}>Remove All Fake Invitations</button>
            </div>

            <Charts items={filteredList} />
        </div>
    );
}

export default Menu;