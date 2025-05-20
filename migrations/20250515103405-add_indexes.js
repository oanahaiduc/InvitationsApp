/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex('Invitations', ['name'], {
      name: 'idx_name'
    });

    await queryInterface.addIndex('Invitations', ['price'], {
      name: 'idx_price'
    });

    await queryInterface.addIndex('Invitations', ['CategoryId', 'price'], {
      name: 'idx_category_price'
    });

    await queryInterface.addIndex('Invitations', ['CategoryId'], {
      name: 'idx_category_id'
    });

    await queryInterface.addIndex('Invitations', [Sequelize.fn('LOWER', Sequelize.col('name'))], {
      name: 'idx_name_ilike'
    });

    await queryInterface.addIndex('Invitations', ['name'], {
      where: {
        isFake: false
      },
      name: 'idx_non_fake'
    });
    await queryInterface.addIndex('Invitations', ['CategoryId', 'id'], {
      name: 'idx_category_id_invitation_id'
    });


    console.log('✅ Indexes added successfully');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('Invitations', 'idx_name');
    await queryInterface.removeIndex('Invitations', 'idx_price');
    await queryInterface.removeIndex('Invitations', 'idx_category_price');
    await queryInterface.removeIndex('Invitations', 'idx_name_ilike');
    await queryInterface.removeIndex('Invitations', 'idx_non_fake');
    await queryInterface.removeIndex('Invitations', 'idx_category_id');
    await queryInterface.removeIndex('Invitations', 'idx_category_id_invitation_id');


    console.log('🚫 Indexes removed successfully');
  }
};