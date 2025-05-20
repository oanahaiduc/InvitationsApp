const { sequelize, Invitation, Category } = require('../server/database/index');  // Adjust the path as needed
const { Op } = require('sequelize');  // Import Op directly from Sequelize

async function deleteFakeData() {
    try {
        console.log('🚫 Deleting all fake data...');

        // Delete fake invitations based on the "isFake" flag
        const deletedInvitations = await Invitation.destroy({ where: { isFake: true } });
        console.log(`✅ Deleted ${deletedInvitations} fake invitations.`);

        // Delete fake categories that start with "Category-"
        const deletedCategories = await Category.destroy({ where: { name: { [Op.iLike]: 'Category-%' } } });
        console.log(`✅ Deleted ${deletedCategories} fake categories.`);
    } catch (error) {
        console.error('❌ Error deleting fake data:', error);
    } finally {
        await sequelize.close();
    }
}

deleteFakeData();
