// MongoDB initialization script
db = db.getSiblingDB('druginfo');

// Create user for the application
db.createUser({
  user: 'druguser',
  pwd: 'drugpass',
  roles: [
    {
      role: 'readWrite',
      db: 'druginfo'
    }
  ]
});

// Create indexes for better performance
db.drugs.createIndex({ "company": 1 });
db.drugs.createIndex({ "launchDate": -1 });
db.drugs.createIndex({ "code": 1 }, { unique: true });

print('Database initialized successfully');