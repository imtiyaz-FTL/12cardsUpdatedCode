const mongoose = require("mongoose");

const playerSchema = require("./player");

const roomSchema = new mongoose.Schema({
    occupancy: {
        type: Number,
        default: 1,
    },
    players: [playerSchema],
    isJoin: {
        type: Boolean,
        default: true,
    },
    disconnect: {
        type: Boolean,
        default: false
    },
    disconnectCount: {
        type: Number,
        default: 0
    },
       gameId: {
        type: Number ,
        default : 100      
    },
    draw_time : Number,

    cardsValue1: {
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
    totalBetSum: {
        type: Number,
        default: 0
    },
    mode: {
        type: String,
        default: "none"
    },
    winPrice:{
    type:String,
    },
    cancelBet: {
        type: Boolean,
        default: false
    },
    disconnectPlayer: {
        type: Boolean,
        default: false
    },
      time: {
        type: Number,
        default: Date.now(),
    },
  currentTime:{
        type:String
    }


}, { versionKey: false });
module.exports = mongoose.model("jeetoJoker", roomSchema);
