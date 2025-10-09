const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

async function createTestUser() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://emilianodiazag:Emiliano123@cluster0.frgf5.mongodb.net/visitas-securiti?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('visitas-securiti');
    
    // Check if admin user already exists
    const existingUser = await db.collection('users').findOne({ username: 'admin' });
    
    if (existingUser) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      username: 'admin',
      email: 'admin@securiti.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      isActive: true
    };
    
    const result = await db.collection('users').insertOne(adminUser);
    console.log('Admin user created with ID:', result.insertedId);
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await client.close();
  }
}

createTestUser();