import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import "../styles/Admin.css";
import Charts from "../components/Charts";

const API_BASE = `http://${window.location.hostname}:5000`;
const socket = io(API_BASE);

function Admin() {
    const [invitations, setInvitations] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isServerDown, setIsServerDown] = useState(false);
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
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadMessage, setUploadMessage] = useState("");
    const [isFakeGenerating, setIsFakeGenerating] = useState(false);

    const EVENT_TYPES = [
        "wedding",
        "birthday",
        "graduation",
        "christening",
        "baby shower",
        "cocktail party"
    ];

    const mergeUniqueInvitations = (serverData, cached) => {
        const tempInvites = cached.filter(item => item.temp);
        return [...serverData, ...tempInvites];
    };

    const fetchInvitations = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/invitations`);
            const serverData = await res.json();
            const cached = JSON.parse(localStorage.getItem("cachedInvitations") || "[]");
            const merged = mergeUniqueInvitations(serverData, cached);
            setInvitations(merged);
            localStorage.setItem("cachedInvitations", JSON.stringify(merged));
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
            if (!navigator.onLine) {
                setIsOffline(true);
                setIsServerDown(false);  // Server may still be up even if offline
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/ping`);
                if (res.ok) {
                    if (isServerDown) {
                        console.info("Server is back up, attempting to sync pending actions.");
                        setIsServerDown(false);
                        await syncPendingActions();  // Sync when server is back up
                    }
                    setIsOffline(false);
                } else if (res.status >= 500) {
                    console.warn("Server is down (5xx response), marking server down.");
                    setIsServerDown(true);
                } else {
                    console.warn("Received non-5xx error, assuming server is up.");
                    setIsServerDown(false);
                }
            } catch (error) {
                console.warn("Network error or server unreachable, marking server down.");
                setIsServerDown(true);
            }
        };

        const handleOnline = () => {
            setIsOffline(false);
            checkStatus();
        };
        const handleOffline = () => {
            setIsOffline(true);
            setIsServerDown(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        checkStatus();

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [isServerDown]);


    const queuePendingAction = (action, tempId = null) => {
        const pending = JSON.parse(localStorage.getItem("pendingAdminActions") || "[]");
        pending.push({ ...action, tempId });
        localStorage.setItem("pendingAdminActions", JSON.stringify(pending));
    };

    const syncPendingActions = async () => {
        if (isOffline || isServerDown) return;

        const pending = JSON.parse(localStorage.getItem("pendingAdminActions") || "[]");
        const synced = [];
        const remaining = [];

        for (const action of pending) {
            try {
                const res = await fetch(action.url, {
                    method: action.method,
                    headers: { "Content-Type": "application/json" },
                    body: action.data ? JSON.stringify(action.data) : undefined
                });

                if (res.ok) {
                    console.log(`Successfully synced action: ${action.url}`);

                    if (action.method === "POST") {
                        const responseData = await res.json();

                        const cached = JSON.parse(localStorage.getItem("cachedInvitations") || "[]");
                        const updated = cached.map(inv =>
                            inv.id === action.tempId ? { ...inv, id: responseData.id, temp: false } : inv
                        );

                        localStorage.setItem("cachedInvitations", JSON.stringify(updated));
                        setInvitations(updated);
                    }

                    synced.push(action);
                } else {
                    console.warn(`Failed to sync action: ${action.url} (status: ${res.status})`);
                    remaining.push(action);
                }
            } catch (error) {
                console.error("Server still down, keeping action in queue:", action.url);
                remaining.push(action);
            }
        }

        localStorage.setItem("pendingAdminActions", JSON.stringify(remaining));

        const cached = JSON.parse(localStorage.getItem("cachedInvitations") || "[]");
        const cleaned = cached.map(item => {
            if (item.temp) {
                const matchedAction = synced.find(a => a.method === "POST" && a.tempId === item.id);
                if (matchedAction) {
                    // Remove temp flag after successful sync
                    return { ...item, temp: false };
                }
            }
            return item;
        });
        localStorage.setItem("cachedInvitations", JSON.stringify(cleaned));
        fetchInvitations();
    };

    const validate = (data) => {
        const errs = {};
        if (!data.name.trim()) errs.name = "Name is required";
        if (!data.eventType || !data.eventType.trim()) errs.eventType = "Event type is required";
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
        const payload = { ...newInvitation, price: parsedPrice };
        const tempId = `temp-${Date.now()}`;
        const tempItem = { ...payload, id: tempId, temp: true };

        const addToPending = () => {
            queuePendingAction({ method: "POST", url: `${API_BASE}/api/invitations`, data: payload }, tempId);
            const cached = JSON.parse(localStorage.getItem("cachedInvitations") || "[]");
            const updated = [...cached, tempItem];
            localStorage.setItem("cachedInvitations", JSON.stringify(updated));
            setInvitations(updated);
        };

        if (isOffline || isServerDown) {
            console.warn("Offline or server down, queuing add action.");
            addToPending();
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/invitations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);

            const responseData = await res.json();

            const cached = JSON.parse(localStorage.getItem("cachedInvitations") || "[]");
            const updated = cached.map(inv =>
                inv.id === tempId ? { ...inv, id: responseData.id, temp: false } : inv
            );
            localStorage.setItem("cachedInvitations", JSON.stringify(updated));
            setInvitations(updated);
        } catch (error) {
            console.error("Server error during add, queuing:", error.message);
            addToPending();
        }

        setNewInvitation({ name: "", eventType: "", price: "", image: "", details: "" });
    };


    const handleDelete = async (id) => {
        const isTemp = String(id).startsWith("temp");

        const addToPendingDelete = () => {
            queuePendingAction({ method: "DELETE", url: `${API_BASE}/api/invitations/${id}` });
            const updated = invitations.filter(inv => inv.id !== id);
            localStorage.setItem("cachedInvitations", JSON.stringify(updated));
            setInvitations(updated);
        };

        if (isOffline || isServerDown || isTemp) {
            console.warn("Offline or server down, queuing delete action.");
            addToPendingDelete();
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/invitations/${id}`, { method: "DELETE" });

            if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);

            await fetchInvitations();
        } catch (error) {
            console.error("Server error during delete, queuing:", error.message);
            addToPendingDelete();
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
        if (!editValues.eventType) {
            editValues.eventType = invitations.find(inv => inv.id === editingId)?.eventType || "";
        }
        const validation = validate(editValues);
        setEditErrors(validation);
        if (Object.keys(validation).length > 0) return;

        const payload = { ...editValues, price: parseFloat(editValues.price) };

        const addToPendingEdit = () => {
            queuePendingAction({
                method: "PATCH",
                url: `${API_BASE}/api/invitations/${editingId}`,
                data: payload
            });
            const updated = invitations.map(inv =>
                inv.id === editingId ? { ...inv, ...payload } : inv
            );
            localStorage.setItem("cachedInvitations", JSON.stringify(updated));
            setInvitations(updated);
        };

        if (isOffline || isServerDown || String(editingId).startsWith("temp")) {
            console.warn("Offline or server down, queuing edit action.");
            addToPendingEdit();
            setEditingId(null);
            setEditValues({});
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/invitations/${editingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`Server responded with status: ${res.status}`);

            await fetchInvitations();
        } catch (error) {
            console.error("Server error during edit, queuing:", error.message);
            addToPendingEdit();
        }

        setEditingId(null);
        setEditValues({});
    };


    const handleFileChange = (e) => {
        setUploadFile(e.target.files[0]);
    };

    const handleFileUpload = async () => {
        if (!uploadFile) return;
        const formData = new FormData();
        formData.append("file", uploadFile);
        try {
            const res = await fetch(`${API_BASE}/api/upload`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            setUploadMessage(res.ok ? "Upload successful!" : "Upload failed: " + data.error);
        } catch (error) {
            setUploadMessage("Upload error: " + error.message);
        }
    };

    const handleToggleFake = async () => {
        const endpoint = isFakeGenerating ? "pause" : "start";
        if (isOffline) {
            queuePendingAction({ method: "POST", url: `${API_BASE}/api/fake/${endpoint}` });
        } else {
            try {
                const res = await fetch(`${API_BASE}/api/fake/${endpoint}`, { method: "POST" });
                if (!res.ok) throw new Error();
            } catch {
                queuePendingAction({ method: "POST", url: `${API_BASE}/api/fake/${endpoint}` });
            }
        }
        setIsFakeGenerating(!isFakeGenerating);
    };

    const handleRemoveFakes = async () => {
        if (isOffline) {
            queuePendingAction({ method: "DELETE", url: `${API_BASE}/api/fake` });
        } else {
            try {
                const res = await fetch(`${API_BASE}/api/fake`, { method: "DELETE" });
                if (!res.ok) throw new Error();
            } catch {
                queuePendingAction({ method: "DELETE", url: `${API_BASE}/api/fake` });
            }
        }
        const updated = invitations.filter(inv => !inv.isFake);
        setInvitations(updated);
        localStorage.setItem("cachedInvitations", JSON.stringify(updated));
    };

    useEffect(() => {
        socket.on("invitationUpdate", (newInvitation) => {
            setInvitations(prev => [...prev, newInvitation]);
        });
        socket.on("fakeCleared", () => {
            fetchInvitations();
        });
        return () => {
            socket.off("invitationUpdate");
            socket.off("fakeCleared");
        };
    }, []);

    return (
        <div className="admin-container">
            <h2>Admin Panel</h2>

            <form onSubmit={handleAdd} className="admin-form">
                <div className="form-group">
                    <label>Event Type</label>
                    <select
                        name="eventType"
                        value={newInvitation.eventType}
                        onChange={handleChange}
                    >
                        <option value="">Select Event Type</option>
                        {EVENT_TYPES.map(type => (
                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                    </select>
                </div>
                {["name", "price", "image", "details"].map((field) => (
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
                                {["name", "price", "image", "details"].map((field) => (
                                    <div className="form-group" key={field}>
                                        <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                        <input
                                            name={field}
                                            type={field === "price" ? "number" : "text"}
                                            value={editValues[field] || ""}
                                            onChange={handleEditChange}
                                        />
                                    </div>
                                ))}

                                <div className="form-group">
                                    <label>Event Type</label>
                                    <select
                                        name="eventType"
                                        value={editValues.eventType || ""}
                                        onChange={handleEditChange}
                                    >
                                        <option value="">Select Event Type</option>
                                        {EVENT_TYPES.map(type => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {Object.values(editErrors).map((err, i) => (
                                    <p key={i} className="error-text">{err}</p>
                                ))}
                                <button onClick={handleSave}>Save</button>
                                <button onClick={handleCancel}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <h3>{inv.name}</h3>
                                <p><strong>Type:</strong> {inv.Category?.name || inv.eventType}</p>
                                <p><strong>Price:</strong> ${Number(inv.price).toFixed(2)}</p>
                                <p><strong>Details:</strong> {inv.details}</p>
                                {inv.temp && (
                                    <p className="pending-sync">🕓 Pending Sync</p>
                                )}
                                <button onClick={() => handleEdit(inv)}>Edit</button>
                                <button onClick={() => handleDelete(inv.id)}>Delete</button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="fake-controls">
                <button onClick={handleToggleFake}>
                    {isFakeGenerating ? "Pause Fake Generation" : "Start Fake Generation"}
                </button>
                <button onClick={handleRemoveFakes}>Remove Fake Invitations</button>
            </div>

            <Charts items={invitations} />

            <div className="upload-section">
                <h3>Upload File</h3>
                <input type="file" onChange={handleFileChange} />
                <button onClick={handleFileUpload}>Upload</button>
                {uploadMessage && <p>{uploadMessage}</p>}
            </div>
        </div>
    );
}

export default Admin;
