import React, { useEffect, useState } from "react";
import "../styles/Admin.css";

function Admin() {
    const [invitations, setInvitations] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [newInvitation, setNewInvitation] = useState({
        name: "",
        eventType: "",
        price: "",
        image: "",
        details: ""
    });
    const [editValues, setEditValues] = useState({});
    const [errors, setErrors] = useState({});
    const [editErrors, setEditErrors] = useState({});

    const fetchInvitations = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/invitations");
            const data = await res.json();
            setInvitations(data);
            localStorage.setItem("cachedInvitations", JSON.stringify(data));
        } catch {
            const cached = localStorage.getItem("cachedInvitations");
            if (cached) setInvitations(JSON.parse(cached));
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    useEffect(() => {
        const checkStatus = async () => {
            if (!navigator.onLine) return setIsOffline(true);

            try {
                const res = await fetch("http://localhost:5000/api/invitations", { method: "HEAD" });
                if (res.ok) {
                    setIsOffline(false);
                    await syncPendingActions();
                } else {
                    setIsOffline(true);
                }
            } catch {
                setIsOffline(true);
            }
        };

        window.addEventListener("online", checkStatus);
        window.addEventListener("offline", () => setIsOffline(true));
        checkStatus();

        return () => {
            window.removeEventListener("online", checkStatus);
            window.removeEventListener("offline", () => setIsOffline(true));
        };
    }, []);

    const queuePendingAction = (action, tempId = null) => {
        const pending = JSON.parse(localStorage.getItem("pendingAdminActions") || "[]");
        pending.push({ ...action, tempId });
        localStorage.setItem("pendingAdminActions", JSON.stringify(pending));
    };

    const syncPendingActions = async () => {
        const pending = JSON.parse(localStorage.getItem("pendingAdminActions") || "[]");
        const synced = [];

        for (const action of pending) {
            try {
                const res = await fetch(action.url, {
                    method: action.method,
                    headers: { "Content-Type": "application/json" },
                    body: action.data ? JSON.stringify(action.data) : undefined
                });

                if (res.ok) {
                    synced.push(action);
                }
            } catch {
                // Still offline
            }
        }

        if (synced.length > 0) {
            const remaining = pending.filter(a => !synced.includes(a));
            localStorage.setItem("pendingAdminActions", JSON.stringify(remaining));

            // Remove synced temp items from cache
            const cached = JSON.parse(localStorage.getItem("cachedInvitations") || "[]");
            const cleaned = cached.filter(item => {
                if (!item.temp) return true;
                return !synced.find(a =>
                    a.method === "POST" &&
                    a.tempId === item.id
                );
            });

            localStorage.setItem("cachedInvitations", JSON.stringify(cleaned));
            fetchInvitations();
        }
    };

    const validate = (data) => {
        const errs = {};
        if (!data.name.trim()) errs.name = "Name is required";
        if (!data.eventType.trim()) errs.eventType = "Event type is required";
        if (!data.image.trim()) errs.image = "Image URL is required";
        if (!data.details.trim()) errs.details = "Details are required";
        if (!data.price || isNaN(data.price) || Number(data.price) <= 0)
            errs.price = "Price must be a positive number";
        return errs;
    };

    const handleChange = (e) => {
        setNewInvitation({ ...newInvitation, [e.target.name]: e.target.value });
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const validation = validate(newInvitation);
        setErrors(validation);
        if (Object.keys(validation).length > 0) return;

        const parsedPrice = parseFloat(newInvitation.price);
        const payload = {
            ...newInvitation,
            celebrantName: "Default",
            eventDate: "2025-01-01",
            eventLocation: "Default",
            customText: "Default",
            quantity: 1,
            price: parsedPrice,
            totalPrice: parsedPrice
        };

        if (isOffline) {
            const tempId = `temp-${Date.now()}`;
            const tempItem = { ...payload, id: tempId, temp: true };

            queuePendingAction({
                method: "POST",
                url: "http://localhost:5000/api/invitations",
                data: payload
            }, tempId);

            const cached = JSON.parse(localStorage.getItem("cachedInvitations") || "[]");
            const updated = [...cached, tempItem];
            localStorage.setItem("cachedInvitations", JSON.stringify(updated));
            setInvitations(updated);
        } else {
            try {
                await fetch("http://localhost:5000/api/invitations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                fetchInvitations();
            } catch {
                const tempId = `temp-${Date.now()}`;
                const tempItem = { ...payload, id: tempId, temp: true };

                queuePendingAction({
                    method: "POST",
                    url: "http://localhost:5000/api/invitations",
                    data: payload
                }, tempId);

                const cached = JSON.parse(localStorage.getItem("cachedInvitations") || "[]");
                const updated = [...cached, tempItem];
                localStorage.setItem("cachedInvitations", JSON.stringify(updated));
                setInvitations(updated);
            }
        }

        setNewInvitation({ name: "", eventType: "", price: "", image: "", details: "" });
    };

    const handleDelete = async (id) => {
        const isTemp = String(id).startsWith("temp");

        if (isOffline || isTemp) {
            queuePendingAction({
                method: "DELETE",
                url: `http://localhost:5000/api/invitations/${id}`
            });

            const updated = invitations.filter(inv => inv.id !== id);
            localStorage.setItem("cachedInvitations", JSON.stringify(updated));
            setInvitations(updated);
        } else {
            try {
                await fetch(`http://localhost:5000/api/invitations/${id}`, { method: "DELETE" });
                fetchInvitations();
            } catch {
                queuePendingAction({
                    method: "DELETE",
                    url: `http://localhost:5000/api/invitations/${id}`
                });
            }
        }
    };

    const handleEdit = (inv) => {
        setEditingId(inv.id);
        setEditValues({ ...inv });
        setEditErrors({});
    };

    const handleEditChange = (e) => {
        setEditValues({ ...editValues, [e.target.name]: e.target.value });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValues({});
    };

    const handleSave = async () => {
        const validation = validate(editValues);
        setEditErrors(validation);
        if (Object.keys(validation).length > 0) return;

        const payload = {
            ...editValues,
            price: parseFloat(editValues.price),
            totalPrice: parseFloat(editValues.price)
        };

        if (isOffline || String(editingId).startsWith("temp")) {
            queuePendingAction({
                method: "PATCH",
                url: `http://localhost:5000/api/invitations/${editingId}`,
                data: payload
            });

            const updated = invitations.map(inv =>
                inv.id === editingId ? { ...inv, ...payload } : inv
            );
            localStorage.setItem("cachedInvitations", JSON.stringify(updated));
            setInvitations(updated);
        } else {
            try {
                await fetch(`http://localhost:5000/api/invitations/${editingId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                fetchInvitations();
            } catch {
                queuePendingAction({
                    method: "PATCH",
                    url: `http://localhost:5000/api/invitations/${editingId}`,
                    data: payload
                });
            }
        }

        setEditingId(null);
        setEditValues({});
    };

    return (
        <div className="admin-container">
            <h2>Admin Panel</h2>

            <form onSubmit={handleAdd} className="admin-form">
                {["name", "eventType", "price", "image", "details"].map((field) => (
                    <div className="form-group" key={field}>
                        <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                        <input
                            name={field}
                            type={field === "price" ? "number" : "text"}
                            value={newInvitation[field]}
                            onChange={handleChange}
                        />
                    </div>
                ))}
                <button type="submit">Add Invitation</button>
            </form>

            {Object.values(errors).length > 0 && (
                <div className="error-panel">
                    {Object.values(errors).map((err, i) => (
                        <p key={i}>{err}</p>
                    ))}
                </div>
            )}

            <div className="admin-list">
                {invitations.map((inv) => (
                    <div key={inv.id} className="admin-item">
                        {editingId === inv.id ? (
                            <>
                                {["name", "eventType", "price", "image", "details"].map((field) => (
                                    <input
                                        key={field}
                                        name={field}
                                        type={field === "price" ? "number" : "text"}
                                        value={editValues[field]}
                                        onChange={handleEditChange}
                                    />
                                ))}
                                {Object.values(editErrors).map((err, i) => (
                                    <p key={i} className="error-text">{err}</p>
                                ))}
                                <button onClick={handleSave}>Save</button>
                                <button onClick={handleCancel}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <h3>{inv.name}</h3>
                                <p><strong>Type:</strong> {inv.eventType}</p>
                                <p><strong>Price:</strong> ${Number(inv.price || inv.totalPrice).toFixed(2)}</p>
                                <p><strong>Details:</strong> {inv.details}</p>
                                {inv.temp && <p style={{ fontSize: "0.8rem", color: "#999" }}>🕓 Pending Sync</p>}
                                <button onClick={() => handleEdit(inv)}>Edit</button>
                                <button onClick={() => handleDelete(inv.id)}>Delete</button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Admin;
