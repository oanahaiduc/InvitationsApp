const { sequelize, Invitation, Category } = require('../server/database/index');  // Adjust the path as needed
const { faker } = require('@faker-js/faker');

async function generateMassiveData() {
    try {
        console.log('✅ Starting to generate massive data...');

        // Batch size for memory efficiency
        const batchSize = 10000;
        const totalBatches = 10;

        // Step 1: Generate 100,000 Unique Categories in Batches
        console.log('🚀 Generating 100,000 unique categories...');
        for (let batch = 0; batch < totalBatches; batch++) {
            const categories = [];
            for (let i = 1; i <= batchSize; i++) {
                const categoryNumber = batch * batchSize + i;
                categories.push({ name: `Category-${categoryNumber}` });
            }
            await Category.bulkCreate(categories, { ignoreDuplicates: true });
            console.log(`✅ Batch ${batch + 1} of categories inserted.`);
        }

        // Step 2: Fetch Category IDs in One Query
        console.log('🔍 Fetching all category IDs...');
        const categoryIds = await Category.findAll({ attributes: ['id'], raw: true });
        console.log(`✅ Fetched ${categoryIds.length} category IDs.`);

        // Step 3: Generate 100,000 Invitations in Batches
        console.log('🚀 Generating 100,000 invitations...');
        for (let batch = 0; batch < totalBatches; batch++) {
            const invitations = [];
            for (let i = 0; i < batchSize; i++) {
                const randomCategory = faker.helpers.arrayElement(categoryIds);
                invitations.push({
                    name: faker.commerce.productName(),
                    image: faker.image.url(),
                    price: parseFloat(faker.commerce.price(1, 100)),
                    details: faker.commerce.productDescription(),
                    CategoryId: randomCategory.id,
                    isFake: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            await Invitation.bulkCreate(invitations, { ignoreDuplicates: true });
            console.log(`✅ Batch ${batch + 1} of invitations inserted.`);
        }

        console.log('🎉 Successfully generated 100,000 unique categories and 100,000 invitations.');
    } catch (error) {
        console.error('❌ Error generating massive data:', error);
    } finally {
        await sequelize.close();
    }
}

generateMassiveData();
