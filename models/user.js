const mongoose = require('mongoose');
const SecretSchema = require('./secret');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  secrets: [SecretSchema]
});

// Export model
module.exports = mongoose.model('User', UserSchema);
