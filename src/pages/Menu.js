import React, { useState, useEffect, useRef } from 'react';
import MenuItem from '../components/MenuItem';
import Charts from '../components/Charts';
import { faker } from '@faker-js/faker';
import { act } from 'react';
import '../styles/Menu.css';

function Menu() {
    const [sortInvitations, setSortInvitations] = useState('price-asc');
    const [maxPrice, setMaxPrice] = useState('');
    const [filteredList, setFilteredList] = useState([]);
    const [fakeInvitations, setFakeInvitations] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [visibleCount, setVisibleCount] = useState(6);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isServerDown, setIsServerDown] = useState(false);
    const fakeThreadRef = useRef(null);

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/invitations');
                if (!res.ok) throw new Error('Server error');

                const data = await res.json();
                localStorage.setItem('cachedInvitations', JSON.stringify(data));
                setIsServerDown(false);

                updateFilteredList(data);
                syncPendingActions();
            } catch (err) {
                console.error('Server down or network error:', err);
                setIsServerDown(true);

                const cached = localStorage.getItem('cachedInvitations');
                if (cached) {
                    updateFilteredList(JSON.parse(cached));
                } else {
                    setFilteredList([]);
                }
            }
        };

        fetchData();
    }, [sortInvitations, maxPrice, fakeInvitations]);

    const syncPendingActions = async () => {
        const pending = JSON.parse(localStorage.getItem('pendingActions') || '[]');
        const synced = [];

        for (const action of pending) {
            try {
                const res = await fetch(action.url, {
                    method: action.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: action.data ? JSON.stringify(action.data) : undefined
                });

                if (res.ok) {
                    synced.push(action);
                }
            } catch (err) {
                console.error('❌ Failed to sync:', action, err);
            }
        }

        if (synced.length > 0) {
            const remaining = pending.filter(a => !synced.includes(a));
            localStorage.setItem('pendingActions', JSON.stringify(remaining));
        }
    };

    const updateFilteredList = (data) => {
        let filtered = [...data];

        if (maxPrice !== '') {
            filtered = filtered.filter(inv => inv.totalPrice <= parseFloat(maxPrice));
        }

        if (sortInvitations === 'price-asc') filtered.sort((a, b) => a.totalPrice - b.totalPrice);
        else if (sortInvitations === 'price-desc') filtered.sort((a, b) => b.totalPrice - a.totalPrice);
        else if (sortInvitations === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortInvitations === 'name-desc') filtered.sort((a, b) => b.name.localeCompare(a.name));

        setFilteredList([...filtered, ...fakeInvitations]);
    };

    const minPrice = Math.min(...filteredList.map(i => i.totalPrice || i.price));
    const maxPriceVal = Math.max(...filteredList.map(i => i.totalPrice || i.price));
    const currentItems = filteredList.slice(0, visibleCount);

    useEffect(() => {
        const handleScroll = () => {
            const bottomReached =
                window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;

            if (bottomReached && visibleCount < filteredList.length) {
                setVisibleCount(prev => prev + 6);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [visibleCount, filteredList]);

    const generateFakeInvitation = () => ({
        name: faker.commerce.productName(),
        eventType: faker.helpers.arrayElement(["birthday", "wedding", "graduation", "cocktail party"]),
        price: parseFloat(faker.commerce.price({ min: 0.5, max: 4.99 })),
        image: 'https://via.placeholder.com/300x200.png?text=Fake+Invite',
        details: faker.commerce.productDescription()
    });

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const startFakeGeneration = async () => {
        setIsAdding(true);
        while (true) {
            if (!fakeThreadRef.current) break;
            const newFake = generateFakeInvitation();

            if (process.env.NODE_ENV === 'test') {
                await act(() => {
                    setFakeInvitations(prev => [...prev, newFake]);
                });
            } else {
                setFakeInvitations(prev => [...prev, newFake]);
            }

            await sleep(2000);
        }
    };

    const toggleFakeAdding = async () => {
        if (isAdding) {
            fakeThreadRef.current = null;
            setIsAdding(false);
        } else {
            fakeThreadRef.current = true;
            await startFakeGeneration();
        }
    };

    const removeFakes = () => {
        fakeThreadRef.current = null;
        setIsAdding(false);
        setFakeInvitations([]);
    };

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "menuSync") {
                const cached = localStorage.getItem("cachedInvitations");
                if (cached) {
                    updateFilteredList(JSON.parse(cached));
                }
            }
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);


    return (
        <div className="menu">
            <h1 className="menuTitle">Our Invitations</h1>

            <div className="statusBar">
                <p>🌐 Network: <strong style={{ color: isOffline ? 'red' : 'green' }}>{isOffline ? 'Offline' : 'Online'}</strong></p>
                <p>🖥️ Server: <strong style={{ color: isServerDown ? 'red' : 'green' }}>{isServerDown ? 'Down' : 'Up'}</strong></p>
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
                    const price = item.totalPrice || item.price;
                    let highlightType = 'avg';
                    if (price === minPrice) highlightType = 'min';
                    if (price === maxPriceVal) highlightType = 'max';

                    return <MenuItem key={i} {...item} price={price} highlightType={highlightType} />;
                })}
            </div>

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
