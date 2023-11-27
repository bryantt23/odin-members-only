const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const SecretSchema = new Schema({
  superhero: { type: String, required: true },
  secretIdentity: { type: String, required: true }
});

// Export model
module.exports = SecretSchema;
