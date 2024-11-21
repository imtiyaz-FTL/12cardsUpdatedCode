const mongoose = require('mongoose');

const stockistSchema = new mongoose.Schema({
    stockistId: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        // default: "low"
    }
});

const stockistModel = mongoose.model('stockistJJ', stockistSchema);
module.exports = stockistModel;