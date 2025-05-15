import React, { useState, useEffect } from 'react';
import io from "socket.io-client";
import MenuItem from '../components/MenuItem';
import '../styles/Menu.css';

const BASE_URL = `http://${window.location.hostname}:5000`; // Use backticks for template literal

const socket = io(BASE_URL);


function Menu() {
    const [sortInvitations, setSortInvitations] = useState('price-asc');
    const [maxPrice, setMaxPrice] = useState('');
    const [invitations, setInvitations] = useState([]); // fetched from API
    const [liveInvitations, setLiveInvitations] = useState([]); // appended live updates
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isServerDown, setIsServerDown] = useState(false);
    const [visibleCount, setVisibleCount] = useState(6);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchData = async () => {
        try {
        const res = await fetch(`${BASE_URL}/api/invitations`);
            if (!res.ok) throw new Error('Server error');
            const data = await res.json();
            setIsServerDown(false);
            setInvitations(data);
        } catch (err) {
            console.error('Server down or network error:', err);
            setIsServerDown(true);
        }
    };

    useEffect(() => {
        fetchData();
    }, [sortInvitations, maxPrice]);

    useEffect(() => {
        socket.on('invitationUpdate', (newInvitation) => {
            setLiveInvitations(prev => [...prev, newInvitation]);
        });
        socket.on('fakeCleared', () => {
            fetchData();
            setLiveInvitations([]);
        });
        return () => {
            socket.off('invitationUpdate');
            socket.off('fakeCleared');
        };
    }, []);

    const updateFilteredList = (data) => {
        let filtered = [...data];
        if (maxPrice !== '') {
            filtered = filtered.filter(inv => inv.price <= parseFloat(maxPrice));
        }
        if (sortInvitations === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortInvitations === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sortInvitations === 'name-asc') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortInvitations === 'name-desc') {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        }
        return filtered;
    };

    const filteredFetched = updateFilteredList(invitations);
    const combinedList = [...filteredFetched, ...liveInvitations];

    const minPrice = Math.min(...combinedList.map(i => i.price));
    const maxPriceVal = Math.max(...combinedList.map(i => i.price));
    const currentItems = combinedList.slice(0, visibleCount);

    useEffect(() => {
        const handleScroll = () => {
            const bottomReached =
                window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
            if (bottomReached && visibleCount < combinedList.length) {
                setVisibleCount(prev => prev + 6);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [combinedList, visibleCount]);

    return (
        <div className="menu">
            <h1 className="menuTitle">Our Invitations</h1>

            <div className="statusBar">
                <p>
                    🌐 Network:{" "}
                    <strong style={{ color: isOffline ? 'red' : 'green' }}>
                        {isOffline ? 'Offline' : 'Online'}
                    </strong>
                </p>
                <p>
                    🖥️ Server:{" "}
                    <strong style={{ color: isServerDown ? 'red' : 'green' }}>
                        {isServerDown ? 'Down' : 'Up'}
                    </strong>
                </p>
            </div>

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
            </div>

            <div className="menuList">
                {currentItems.map((item, i) => {
                    let highlightType = 'avg';
                    if (item.price === minPrice) highlightType = 'min';
                    if (item.price === maxPriceVal) highlightType = 'max';
                    return <MenuItem key={i} {...item} price={item.price} highlightType={highlightType} />;
                })}
            </div>
        </div>
    );
}

export default Menu;
