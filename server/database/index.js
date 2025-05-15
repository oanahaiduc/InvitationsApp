const { Sequelize, DataTypes, Op } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'invitations_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);

const Invitation = sequelize.define('Invitation', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isFake: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const Category = sequelize.define('Category', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    }
});

Category.hasMany(Invitation);
Invitation.belongsTo(Category);

const getInvitationsFilters = (queryParams) => {
    const where = {};

    if (queryParams.minPrice || queryParams.maxPrice) {
        where.price = {};
        if (queryParams.minPrice) {
            where.price[Op.gte] = parseFloat(queryParams.minPrice);
        }
        if (queryParams.maxPrice) {
            where.price[Op.lte] = parseFloat(queryParams.maxPrice);
        }
    }
    if ( queryParams.search ){
        where.name = { [Op.iLike]: `%${queryParams.search}%` };
    }
    return where;
}

const getInvitationsOrder = (queryParams) => {
    if(queryParams.sortField){
        const direction = queryParams.sortOrder === 'desc' ? 'DESC' : 'ASC';
        return [[queryParams.sortField, direction]];
    }
    return [['name', 'DESC']];
}

const initDB = async (initialData) => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully');

        if (initialData && Array.isArray(initialData)) {
            const count = await Invitation.count();
            if (count === 0) {
                // Step 1: Create unique categories
                const uniqueCategories = [...new Set(initialData.map(item => item.eventType))];
                const categoryMap = {};

                for (const name of uniqueCategories) {
                    const [category] = await Category.findOrCreate({ where: { name } });
                    categoryMap[name] = category.id;
                }

                // Step 2: Create invitations with proper categoryId
                for (const item of initialData) {
                    await Invitation.create({
                        name: item.name,
                        image: item.image,
                        price: item.price,
                        details: item.details,
                        CategoryId: categoryMap[item.eventType],
                        isFake: false
                    });
                }

                console.log('Initial data inserted successfully');
            }
        }
    } catch (error) {
        console.error('Database synchronization error:', error);
    }
};

module.exports = {
    sequelize,
    Invitation,
    Category,
    Op,
    getInvitationsFilters,
    getInvitationsOrder,
    initDB
}