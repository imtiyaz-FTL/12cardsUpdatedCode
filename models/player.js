const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
    playerName: {
        type: String,
    },
    playerId: {
        type: String,
        unique: true,
    },
    socketID: {
        type: String,
    },
    wonCoin: {
        type: Number,
        default: 0,
    },
    totalCoin: {
        type: String,
    },
    profileImgUrl: {
        type: String,
        // required: true,
    },
    playerStatus: {
        type: String,
    },
    bet: {
        type: Number,
        default: 0
    },
    cardSetValue: {
        type: [{
            card:Number,
            value:Number
        }],
        default: [

            {
                card: 11,
                value: 0
            },
            {
                card: 12,
                value: 0
            },
            {
                card: 13,
                value: 0,
            },
            {
                card: 14,
                value: 0
            },
            {
                card: 21,
                value: 0,
            },
            {
                card: 22,
                value: 0,
            },
            {
                card: 23,
                value: 0,
            },
            {
                card: 24,
                value: 0,
            },
            {
                card: 31,
                value: 0,
            },
            {
                card: 32,
                value: 0,
            },
            {
                card: 33,
                value: 0,
            },
            {
                card: 34,
                value: 0,
            }
        ],

    },
    betSum: {
        type: Number,
        default: 0
    },
    mode: {
        type: String,
        default: "none"
    },

    playerCard: [String],


});

module.exports = playerSchema;
