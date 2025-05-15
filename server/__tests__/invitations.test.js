const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../index'); // Adjust the path if needed

describe('Invitations API', () => {
    let createdId;

    it('GET /api/invitations should return all invitations', async () => {
        const res = await request(app).get('/api/invitations');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/invitations should create a new invitation', async () => {
        const newInvitation = {
            name: "Test Invitation",
            eventType: "wedding",
            image: "https://example.com/test.png",
            details: "Test invitation details",
            price: 2.99
        };

        const res = await request(app)
            .post('/api/invitations')
            .send(newInvitation)
            .set('Accept', 'application/json');
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(newInvitation.name);
        createdId = res.body.id;
    });

    it('PATCH /api/invitations/:id should update an invitation', async () => {
        const updatedFields = { name: "Updated Invitation", price: 3.99 };
        const res = await request(app)
            .patch(`/api/invitations/${createdId}`)
            .send(updatedFields)
            .set('Accept', 'application/json');
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe(updatedFields.name);
        expect(res.body.price).toBe(updatedFields.price);
    });

    it('GET /api/invitations/:id should return one invitation', async () => {
        const res = await request(app).get(`/api/invitations/${createdId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', createdId);
    });

    it('DELETE /api/invitations/:id should remove an invitation', async () => {
        const res = await request(app).delete(`/api/invitations/${createdId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/Deleted successfully/);
    });

    it('GET /api/invitations/:id with invalid id should return 404', async () => {
        const res = await request(app).get('/api/invitations/99999');
        expect(res.statusCode).toBe(404);
    });

    it('POST with invalid data should return 400', async () => {
        const res = await request(app)
            .post('/api/invitations')
            .send({ name: "", price: 0 });
        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toBeDefined();
    });
});

describe('Extended API Coverage', () => {
    describe('GET /api/invitations with query parameters', () => {
        it('should filter invitations by maxPrice, eventType and sort by name-asc', async () => {
            const res = await request(app)
                .get('/api/invitations')
                .query({ maxPrice: 100, eventType: 'wedding', sortOrder: 'name-asc' });
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            res.body.forEach(invitation => {
                expect(invitation.price).toBeLessThanOrEqual(100);
                expect(invitation.eventType).toBe('wedding');
            });
        });
    });

    describe('File Upload Endpoint', () => {
        it('POST /api/upload should return 400 when no file is attached', async () => {
            const res = await request(app).post('/api/upload');
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('No file provided');
        });

        it('POST /api/upload should succeed when a file is attached', async () => {
            const tempFilePath = path.join(__dirname, 'temp.txt');
            fs.writeFileSync(tempFilePath, 'dummy file content');

            const res = await request(app)
                .post('/api/upload')
                .attach('file', tempFilePath);
            fs.unlinkSync(tempFilePath);
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toMatch(/Upload successful/);
            expect(res.body.file).toBeDefined();
        });
    });

    describe('Fake Invitations Endpoints', () => {
        it('POST /api/fake/start should start fake generation', async () => {
            const res = await request(app).post('/api/fake/start');
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toMatch(/Fake generation started/);
        });

        it('POST /api/fake/start again should return 400 when generation is already running', async () => {
            const res = await request(app).post('/api/fake/start');
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/already running/);
        });

        it('POST /api/fake/pause should pause fake generation', async () => {
            const res = await request(app).post('/api/fake/pause');
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toMatch(/paused/);
        });

        it('POST /api/fake/pause when not running should return 400', async () => {
            const res = await request(app).post('/api/fake/pause');
            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/not running/);
        });

        it('DELETE /api/fake should remove fake invitations', async () => {
            const getRes = await request(app).get('/api/invitations');
            const beforeCount = getRes.body.length;

            const res = await request(app).delete('/api/fake');
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toMatch(/Removed/);

            const afterRes = await request(app).get('/api/invitations');
            expect(afterRes.body.length).toBeLessThanOrEqual(beforeCount);
        });
    });
});