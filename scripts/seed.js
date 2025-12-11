const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/freshmart', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  seedDatabase();
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});

    console.log('Seeding database...');

    // Create default admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@freshmart.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin user created:', admin.email);

    // Create sample products
    const products = [
      {
        name: 'Basmati Rice 5kg',
        price: 1450,
        category: 'grocery',
        image: 'rice.jpg',
        description: 'Premium quality basmati rice',
        stock: 50
      },
      {
        name: 'Surf Excel 2kg',
        price: 850,
        category: 'cleaning',
        image: 'surfexcel.jpg',
        description: 'Detergent powder for clothes',
        stock: 30
      },
      {
        name: 'Sunflower Oil 1L',
        price: 620,
        category: 'oil',
        image: 'oil.jpg',
        description: 'Pure sunflower cooking oil',
        stock: 40
      },
      {
        name: 'Cooking Oil 5L',
        price: 3100,
        category: 'oil',
        image: 'oil2.jpg',
        description: 'Large pack cooking oil',
        stock: 20
      },
      {
        name: 'Detergent Liquid',
        price: 560,
        category: 'cleaning',
        image: 'liquid.jpg',
        description: 'Liquid detergent for washing',
        stock: 35
      },
      {
        name: 'Wheat Flour 10kg',
        price: 890,
        category: 'grocery',
        image: 'flour.jpg',
        description: 'Fine quality wheat flour',
        stock: 25
      },
      {
        name: 'Dish Cleaner',
        price: 240,
        category: 'cleaning',
        image: 'dish.jpg',
        description: 'Dishwashing liquid',
        stock: 45
      },
      {
        name: 'Sugar 2kg',
        price: 310,
        category: 'grocery',
        image: 'sugar.jpg',
        description: 'Fine white sugar',
        stock: 50
      },
      {
        name: 'Next Cola 1.5L',
        price: 180,
        category: 'beverages',
        image: 'cola.jpg',
        description: 'Refreshing cola drink',
        stock: 60
      },
      {
        name: 'Orange Juice',
        price: 250,
        category: 'beverages',
        image: 'juice.jpg',
        description: 'Fresh orange juice',
        stock: 40
      },
      {
        name: 'Tomatoes 1kg',
        price: 120,
        category: 'vegetables',
        image: 'tomatoes.jpg',
        description: 'Fresh red tomatoes',
        stock: 100
      },
      {
        name: 'Potatoes 1kg',
        price: 90,
        category: 'vegetables',
        image: 'potatoes.jpg',
        description: 'Fresh potatoes',
        stock: 100
      },
      {
        name: 'Apples 1kg',
        price: 180,
        category: 'fruits',
        image: 'apples.jpg',
        description: 'Fresh red apples',
        stock: 50
      },
      {
        name: 'Bananas (dozen)',
        price: 150,
        category: 'fruits',
        image: 'bananas.jpg',
        description: 'Fresh bananas',
        stock: 40
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} products created`);

    console.log('\nDatabase seeded successfully!');
    console.log('\nDefault Admin Credentials:');
    console.log('Email: admin@freshmart.com');
    console.log('Password: admin123');
    console.log('\nYou can now start the server with: npm start');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

