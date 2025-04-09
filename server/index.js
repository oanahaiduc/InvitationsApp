const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

console.log("✅ Setting up middleware...");
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(cors());
app.use(bodyParser.json());

let invitations = [];
let nextId = 1;

console.log("🔄 Trying to load initialData...");
try {
    const { MenuList } = require('./data/initialData');
    console.log("✅ Loaded MenuList");

    invitations = MenuList.map(inv => ({
        ...inv,
        id: nextId++,
        totalPrice: inv.price
    }));

    console.log(`✅ Initialized ${invitations.length} invitations`);
} catch (error) {
    console.error("❌ Failed to load initialData:", error);
}

function validateInvitation(data) {
    const errors = {};
    if (!data.name?.trim()) errors.name = "Name is required";
    if (!data.eventType?.trim()) errors.eventType = "Event type is required";
    if (!data.image?.trim()) errors.image = "Image is required";
    if (!data.details?.trim()) errors.details = "Details are required";
    if (!data.celebrantName?.trim()) errors.celebrantName = "Celebrant name is required";
    if (!data.eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.eventDate)) {
        errors.eventDate = "Event date must be in YYYY-MM-DD format";
    }
    if (!data.eventLocation?.trim()) errors.eventLocation = "Event location is required";
    if (!data.customText?.trim()) errors.customText = "Custom text is required";
    if (typeof data.quantity !== 'number' || data.quantity < 1) {
        errors.quantity = "Quantity must be at least 1";
    }
    return errors;
}

function validatePartialInvitation(data) {
    const errors = {};
    if ('name' in data && !data.name?.trim()) errors.name = "Name is required";
    if ('eventType' in data && !data.eventType?.trim()) errors.eventType = "Event type is required";
    if ('image' in data && !data.image?.trim()) errors.image = "Image is required";
    if ('details' in data && !data.details?.trim()) errors.details = "Details are required";
    if ('celebrantName' in data && !data.celebrantName?.trim()) errors.celebrantName = "Celebrant name is required";
    if ('eventDate' in data && !/^\d{4}-\d{2}-\d{2}$/.test(data.eventDate)) {
        errors.eventDate = "Event date must be in YYYY-MM-DD format";
    }
    if ('eventLocation' in data && !data.eventLocation?.trim()) errors.eventLocation = "Event location is required";
    if ('customText' in data && !data.customText?.trim()) errors.customText = "Custom text is required";
    if ('quantity' in data && (typeof data.quantity !== 'number' || data.quantity < 1)) {
        errors.quantity = "Quantity must be at least 1";
    }
    return errors;
}

app.get('/api/invitations', (req, res) => {
    try {
        const { maxPrice, sortOrder, eventType } = req.query;
        let result = [...invitations];

        if (maxPrice) result = result.filter(inv => inv.totalPrice <= parseFloat(maxPrice));
        if (eventType) result = result.filter(inv => inv.eventType === eventType);

        if (sortOrder === 'price-asc') result.sort((a, b) => a.totalPrice - b.totalPrice);
        else if (sortOrder === 'price-desc') result.sort((a, b) => b.totalPrice - a.totalPrice);
        else if (sortOrder === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortOrder === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/invitations/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const invitation = invitations.find(inv => inv.id === id);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
    res.json(invitation);
});

app.post('/api/invitations', (req, res) => {
    const errors = validateInvitation(req.body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    const {
        name, eventType, image, details, celebrantName,
        eventDate, eventLocation, customText, quantity, totalPrice
    } = req.body;

    const newInvitation = {
        id: nextId++,
        name,
        eventType,
        image,
        details,
        celebrantName,
        eventDate,
        eventLocation,
        customText,
        quantity,
        totalPrice
    };

    invitations.push(newInvitation);
    res.status(201).json(newInvitation);
});

app.patch('/api/invitations/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = invitations.findIndex(inv => inv.id === id);
    if (index === -1) return res.status(404).json({ message: "Invitation not found" });

    const errors = validatePartialInvitation(req.body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    invitations[index] = { ...invitations[index], ...req.body, id };
    res.json(invitations[index]);
});

app.delete('/api/invitations/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = invitations.findIndex(inv => inv.id === id);
    if (index === -1) return res.status(404).json({ message: 'Invitation not found' });

    const deleted = invitations.splice(index, 1);
    res.json({ message: 'Deleted successfully', invitation: deleted[0] });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Invitations API running on http://localhost:${PORT}`);
    });
}

module.exports = app;
