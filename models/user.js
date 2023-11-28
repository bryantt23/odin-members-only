const mongoose = require('mongoose');
const SecretSchema = require('./secret');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  secrets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Secret' }],
  isAdmin: { type: Boolean, default: false }
});

// Export model
module.exports = mongoose.model('User', UserSchema);
