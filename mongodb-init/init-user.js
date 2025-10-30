// MongoDB initialization script to create user and database
db = db.getSiblingDB('paas_db');

// Create user for the application
db.createUser({
  user: 'paas_user',
  pwd: 'paas_password',
  roles: [
    { role: 'readWrite', db: 'paas_db' }
  ]
});

print('User paas_user created successfully for database paas_db');









