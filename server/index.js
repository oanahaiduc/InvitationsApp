const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { faker } = require('@faker-js/faker');


const {sequelize, Invitation, Category, initDB, Op } = require('./database');
const { MenuList } = require('./data/initialData');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
};

console.log("✅ Setting up middleware...");
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(cors());
app.use(bodyParser.json());

initDB(MenuList);

const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
    }
    res.json({ message: 'Upload successful!', file: req.file });
});

function validateInvitation(data) {
    const errors = {};
    if (!data.name?.trim()) errors.name = "Name is required";
    if (!data.eventType?.trim()) errors.eventType = "Event type is required";
    if (!data.image?.trim()) errors.image = "Image is required";
    if (!data.details?.trim()) errors.details = "Details are required";
    if (typeof data.price !== 'number' || data.price <= 0) {
        errors.price = "Price must be a positive number";
    }
    return errors;
}

function validatePartialInvitation(data) {
    const errors = {};
    if ('name' in data && !data.name?.trim()) errors.name = "Name is required";
    if ('eventType' in data && !data.eventType?.trim()) errors.eventType = "Event type is required";
    if ('image' in data && !data.image?.trim()) errors.image = "Image is required";
    if ('details' in data && !data.details?.trim()) errors.details = "Details are required";
    if ('price' in data && (typeof data.price !== 'number' || data.price <= 0)) {
        errors.price = "Price must be a positive number";
    }
    return errors;
}

app.get('/api/invitations', async (req, res) => {
    try {
        const { maxPrice, sortOrder, eventType } = req.query;
        const where = {}; // Only show real invitations by default
        const order = [];

        if (maxPrice) {
            where.price = { [Op.lte]: parseFloat(maxPrice) };
        }

        if (eventType) {
            const category = await Category.findOne({ where: { name: eventType } });
            if (category) where.CategoryId = category.id;
            else return res.json([]);
        }

        if (sortOrder === 'price-asc') order.push(['price', 'ASC']);
        else if (sortOrder === 'price-desc') order.push(['price', 'DESC']);
        else if (sortOrder === 'name-asc') order.push(['name', 'ASC']);
        else if (sortOrder === 'name-desc') order.push(['name', 'DESC']);

        const results = await Invitation.findAll({
            where,
            order,
            include: Category
        });

        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/invitations/:id', async (req, res) => {
    try {
        const invitation = await Invitation.findByPk(req.params.id, { include: Category });
        if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
        res.json(invitation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/invitations', async (req, res) => {
    const { name, eventType, image, details, price } = req.body;
    const errors = {};

    if (!name?.trim()) errors.name = "Name is required";
    if (!eventType?.trim()) errors.eventType = "Event type is required";
    if (!image?.trim()) errors.image = "Image is required";
    if (!details?.trim()) errors.details = "Details are required";
    if (typeof price !== 'number' || price <= 0) errors.price = "Price must be a positive number";

    if (Object.keys(errors).length) return res.status(400).json({ errors });

    try {
        const category = await Category.findOne({ where: { name: eventType } });
        if (!category) return res.status(400).json({ message: "Invalid event type" });

        const newInvitation = await Invitation.create({
            name, image, details, price, CategoryId: category.id, isFake: false
        });
        res.status(201).json(newInvitation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/invitations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const invitation = await Invitation.findByPk(id);
        if (!invitation) return res.status(404).json({ message: "Invitation not found" });

        const updateData = req.body;
        if (updateData.eventType) {
            const category = await Category.findOne({ where: { name: updateData.eventType } });
            if (!category) return res.status(400).json({ message: "Invalid event type" });
            updateData.CategoryId = category.id;
        }

        await invitation.update(updateData);
        res.json(invitation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/invitations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const invitation = await Invitation.findByPk(id);
        if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
        await invitation.destroy();
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

let fakeGenerationInterval = null;
app.post('/api/fake/start', async (req, res) => {
    if (fakeGenerationInterval) {
        return res.status(400).json({ message: 'Fake generation already running' });
    }

    fakeGenerationInterval = setInterval(async () => {
        const fake = {
            name: faker.commerce.productName(),
            image: "GreenGraduationInvitation.png",
            eventType: faker.helpers.arrayElement(["birthday", "wedding", "graduation", "cocktail party"]),
            price: parseFloat(faker.commerce.price({ min: 0.5, max: 4.99 })),
            details: faker.commerce.productDescription(),
        };

        const category = await Category.findOne({ where: { name: fake.eventType } });
        if (!category) return;

        const newFake = await Invitation.create({
            ...fake,
            CategoryId: category.id,
            isFake: true
        });
        const fullFake = await Invitation.findByPk(newFake.id, { include: Category });

        io.emit('invitationUpdate', fullFake);
    }, 2000);

    res.json({ message: 'Fake generation started' });
});

app.post('/api/fake/pause', (req, res) => {
    if (!fakeGenerationInterval) return res.status(400).json({ message: 'Fake generation is not running' });
    clearInterval(fakeGenerationInterval);
    fakeGenerationInterval = null;
    res.json({ message: 'Fake generation paused' });
});

app.delete('/api/fake', async (req, res) => {
    try {
        const deleted = await Invitation.destroy({ where: { isFake: true } });
        io.emit('fakeCleared');
        res.json({ message: `Removed ${deleted} fake invitations` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/top-categories', async (req, res) => {
    try {
        const results = await sequelize.query(`
            SELECT c.name, COUNT(i.id) AS invitation_count
            FROM "Invitations" i
            JOIN "Categories" c ON i."CategoryId" = c.id
            GROUP BY c.name
            ORDER BY invitation_count DESC
            LIMIT 10;
        `, { type: sequelize.QueryTypes.SELECT });

        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// This must be AFTER all your API routes
app.use(express.static(path.join(__dirname, '../build')));

app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);
    const invitations = await Invitation.findAll({ where: { isFake: false }, include: Category });
    socket.emit('initialInvitations', invitations);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});



server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Invitations API running on http://localhost:${PORT}`);
});

module.exports = app;