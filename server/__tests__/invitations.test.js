const request = require('supertest');
const app = require('../index');

describe('Invitations API', () => {
    let createdId;

    it('GET /api/invitations should return all invitations', async () => {
        const res = await request(app).get('/api/invitations');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/invitations should create a new invitation', async () => {
        const newInvitation = {
            name: "Test Invite",
            eventType: "wedding",
            image: "https://example.com/image.jpg",
            details: "Test details",
            celebrantName: "John Doe",
            eventDate: "2025-05-20",
            eventLocation: "Test City",
            customText: "You're invited!",
            quantity: 5,
            totalPrice: 2.5
        };

        const res = await request(app)
            .post('/api/invitations')
            .send(newInvitation);

        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe(newInvitation.name);
        createdId = res.body.id;
    });

    it('PATCH /api/invitations/:id should update an invitation', async () => {
        const res = await request(app)
            .patch(`/api/invitations/${createdId}`)
            .send({ name: "Updated Invite", quantity: 10 });

        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe("Updated Invite");
        expect(res.body.quantity).toBe(10);
    });

    it('GET /api/invitations/:id should return one invitation', async () => {
        const res = await request(app).get(`/api/invitations/${createdId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBe(createdId);
    });

    it('DELETE /api/invitations/:id should remove an invitation', async () => {
        const res = await request(app).delete(`/api/invitations/${createdId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/Deleted successfully/);
    });

    it('GET /api/invitations/:id with invalid ID should return 404', async () => {
        const res = await request(app).get(`/api/invitations/99999`);
        expect(res.statusCode).toBe(404);
    });

    it('POST with invalid data should return 400', async () => {
        const res = await request(app)
            .post('/api/invitations')
            .send({ name: "", quantity: 0 });

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toBeDefined();
    });
});
