const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const SecretSchema = new Schema({
  superhero: { type: String, required: true },
  secretIdentity: { type: String, required: true }
});

// Convert the schema into a model and export it
const Secret = mongoose.model('Secret', SecretSchema);
module.exports = Secret;
