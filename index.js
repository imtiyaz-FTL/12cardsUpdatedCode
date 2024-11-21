
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const axios = require('axios');
// const FormData = require('form-data');
dotenv.config();
connectDB = require("./config/db");
const http = require("http");
const cors = require("cors");
app.use(cors());
const db = connectDB();
const server = http.createServer(app);
app.use(express.json());
var io = require("socket.io")(server);
const jeetoJokerRoom = require("./models/room")

async function sleep(timer) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timer)
    })
}


io.on('connection', async (socket) => {

    /**
     * Connection Handler.
    **/
    console.log(`one socket connected:${socket.id}`);
    /**
     * Socket Events For Application Logic.
    **/
    socket.on("joinRoom", async (body) => {
        try {
            let playerId = body.playerId;
            let name = body.name;
            let totalCoin = body.totalCoin;
            let profileImageUrl = body.profileImageUrl;
            let playerStatus = body.playerStatus;

            let all = await jeetoJokerRoom.find();
            let roomId = " ";

            all.every(element => {
                if (element.isJoin == true) {
                    roomId = element._id.toString();
                    return false;
                }
                return true;
            });

            if (roomId == " ") {
                //CREATES A NEW ROOM IF NO EMPTY ROOM IS FOUND

                console.log(`${name}`);

                let roomJJ = new jeetoJokerRoom();

                let player = {
                    socketID: socket.id,
                    playerId: playerId,
                    name: name,
                    playerType: 'Real Player',
                    totalCoin: totalCoin,
                    profileImageUrl: profileImageUrl,
                    playerStatus: playerStatus
                };

                roomJJ.players.push(player);



                let roomId = roomJJ._id.toString();

                socket.join(roomId);

                socket.emit('createRoomSuccess', roomJJ);
                // roomJJ.isJoin = false
                roomJJ = await roomJJ.save();
                io.to(roomId).emit("startGame", true)


                console.log(roomJJ)
            }
            else {

                //JOINS A ROOM WHICH IS NOT FULL
                roomJJ = await jeetoJokerRoom.findById(roomId);

                if (roomJJ.isJoin) {
                    let player = {
                        socketID: socket.id,
                        playerId: playerId,
                        name: name,
                        playerType: 'Real Player',
                        totalCoin: totalCoin,
                        profileImageUrl: profileImageUrl,
                        playerStatus: playerStatus
                    };

                    let players = roomJJ.players;

                    let flagging = 0;
                    let index = 0;

                    players.every(element => {
                        if (element.playerId == playerId) {
                            // players.filter((element) => {
                            //     return element.playerId != playerId
                            // })
                            // players.remove(element);
                            flagging++;
                            return false;
                        }
                        index++;
                        return true;
                    });

                    if (flagging == 0) {
                        roomJJ.players.push(player);
                    }
                    else {
                        roomJJ.players[index] = player;
                    }

                    socket.join(roomId);



                    roomJJ = await roomJJ.save();

                    io.to(roomId).emit('updatedPlayers', roomJJ.players);
                    socket.emit('updatedPlayer', player);
                    io.to(roomId).emit('updatedRoom', roomJJ);
                    io.to(roomId).emit('roomMessage', `${name} has joined the room.`);
                    io.to(roomId).emit("GameId", roomJJ.gameId)
                    io.to(roomId).emit("drawTime", roomJJ.draw_time)
                }
                else {
                    socket.emit('errorOccured', 'Sorry! The Room is full. Please try again.');
                    return;
                }
            }

        } catch (error) {
            console.log(error)
        }



    })
    socket.on("start", async (body) => {
        try {
            console.log("game started")
            let roomId = body.roomId;
            let roomJJ = await jeetoJokerRoom.findById(roomId)
            socket.join(roomId)
            let mediumCounter = 0
            do {
                var gameId = Math.floor(Date.now() / 1000);
                var drawTime = Math.floor(Date.now() / 1000 + 90)
                io.to(roomId).emit('GameId', gameId);
                console.log(gameId,"kkkkkkkkkkkkkkkkkkkkk")
                io.to(roomId).emit('betting', true);
                io.to(roomId).emit('drawTime', drawTime);
                roomJJ.gameId = gameId;
                roomJJ.draw_time = drawTime;
                roomJJ = await roomJJ.save();
                io.to(roomId).emit('roomMessage', "Betting Time Starts. Place your bets now.");
                for (let i = 0; i < 87; i++) {
                    io.to(roomId).emit('timer', (90 - i).toString());
                    let roomJJ = await jeetoJokerRoom.findById(roomId)
                    roomJJ.currentTime = (90 - i).toString()
                    roomJJ = await roomJJ.save()
                    await sleep(1000);

                    if (roomJJ === null) {
                        break
                    }
                }

                roomJJ = await jeetoJokerRoom.findById(roomId)
                if (roomJJ == null) {
                    return;
                }
                io.to(roomId).emit('roomData', roomJJ);
                io.to(roomId).emit('timer', '3');

                await sleep(1000);
                io.to(roomId).emit('timer', '2');
                await sleep(1000);
                io.to(roomId).emit('timer', '1');
                await sleep(1000);
                io.to(roomId).emit('timer', '0');
                io.to(roomId).emit('roomMessage', "Betting Time Stops. Now the winner is being decided.");
                io.to(roomId).emit('betting', false);
                roomJJ = await jeetoJokerRoom.findById(roomId)
                roomJJ.cancelBet = true
                roomJJ = await roomJJ.save()

                roomJJ = await jeetoJokerRoom.findById(roomId)
                //    global cards array values
                for (let i = 0; i < roomJJ.players.length; i++) {
                    for (let j = 0; j < roomJJ.cardsValue1.length; j++) {
                        roomJJ.cardsValue1[j].value = roomJJ.cardsValue1[j].value + roomJJ.players[i].cardSetValue[j].value

                    }
                }
                roomJJ = await roomJJ.save()
                console.log(roomJJ.cardsValue1, "++++++++++++++Updated cardsValue1+++++++++++");
                // Update totalBetSum
                for (let i = 0; i < roomJJ.cardsValue1.length; i++) {
                    roomJJ.totalBetSum = roomJJ.totalBetSum + roomJJ.cardsValue1[i].value
                }
                roomJJ = await roomJJ.save()
                console.log(roomJJ.totalBetSum, "++++++++++bet sum total+++++++++")
                io.to(roomId).emit("roomData", roomJJ);

                //High mode function....
               async function HighMode(){
                 

                        console.log("+++++++++++++++++high+++++++++++++++++++")
                        function findCardsInRange(arr) {
                            let totalSum = roomJJ.totalBetSum
                            let lowerThreshold1 = 0.0 * totalSum;
                            let upperThreshold1 = 1.4 * totalSum;

                            let cardsInRange = [];
                            let valueInRange = []

                            for (let i = 0; i < arr.length; i++) {
                                let card = arr[i];
                                let cardValue = card.value * 10;

                              
                                    cardsInRange.push(card.card);
                                    valueInRange.push(cardValue)
                                
                            }



                            return { cardsInRange, valueInRange };
                        }

                        // Usage:

                        let output = findCardsInRange(roomJJ.cardsValue1);
                        console.log("The cards whose 10 times their value is within the specified ranges are:", output.cardsInRange);
                        // let maxCardValue = output.valueInRange
                        let minCardValue = output.valueInRange
                        minCardValue.sort((a, b) => a - b)
                        console.log(minCardValue[minCardValue.length - 1], "=========kiiiiiiiiiiiiiiiiiiiiiii+++++++++")
                        let minValue = minCardValue[minCardValue.length - 1]

                        console.log(minValue)
                        let index = -1
                        var array2 = []
                        for (let i = 0; i < roomJJ.cardsValue1.length; i++) {

                            roomJJ = await jeetoJokerRoom.findById(roomId)
                            if (roomJJ.cardsValue1[i].value == minValue / 10) {
                                array2.push(roomJJ.cardsValue1[i].card)

                                index = i

                            }
                        }
                        console.log(array2, "+++++hiiiiiiiiiiiiiiii+++++++++")
                        var randomIndex1 = Math.floor(Math.random() * array2.length);
                        var randomElement1 = array2[randomIndex1];
                        if (roomJJ.totalBetSum > 0) {
                            var is_beted = 1
                        } else {
                            var is_beted = 0
                        }
                        if (index !== -1) {
                            io.to(roomId).emit("slot", randomElement1);

                            const apiUrl = "https://kheloindians.in/login/api/live-data-from-node";
                            const requestData = {
                                win_number: randomElement1.toString(),
                                game_name: "jeetoJoker",
                                win_price: roomJJ.winPrice,
                                is_beted: is_beted.toString()
                            };

                            console.log("Request Data:", requestData);

                            axios.post(apiUrl, requestData)
                                .then(response => {
                                    console.log("API Response:", response.data);
                                })
                                .catch(error => {
                                    console.error("API request failed:", error.message);
                                    // Handle the error gracefully, e.g., log it and continue with the rest of the application
                                });
                        } else {
                            console.log("window size increased");
                        }
                    

                }

                //Medium mode function..
              async  function MediumMode(){
                  
                        console.log("+++++++++++++++++++medium++++++++++++++++++++++++++++++++")
                        function findCardsInRange(arr) {
                            let totalSum = roomJJ.totalBetSum
                            console.log(totalSum, "++++++++++++totalSum+++++++++++")
                            let lowerThreshold1 = 0.0 * totalSum;
                            let upperThreshold1 = 1.0 * totalSum;
                            let cardsInRange = [];
                            let valueInRange = []
                            for (let i = 0; i < arr.length; i++) {
                                let card = arr[i];
                                let cardValue = card.value * 10;

                                if (cardValue >= lowerThreshold1 && cardValue <= upperThreshold1) {
                                    cardsInRange.push(card.card);
                                    valueInRange.push(cardValue)
                                }
                            }



                            return { cardsInRange, valueInRange };
                        }

                        // Usage:

                        let output = findCardsInRange(roomJJ.cardsValue1);
                        console.log("The cards whose 10 times their value is within the specified ranges are:", output.cardsInRange);
                        let minCardValue = output.valueInRange
                        const randomIndex = Math.floor(Math.random() * minCardValue.length);

                        console.log(minCardValue[randomIndex], "=========kiiiiiiiiiiiiiiiiiiiiiii+++++++++")
                        let minValue = minCardValue[randomIndex]
                        // let minValue = Math.min(...minCardValue)
                        let index = -1

                        var array2 = []
                        for (let i = 0; i < roomJJ.cardsValue1.length; i++) {
                            roomJJ = await jeetoJokerRoom.findById(roomId)
                            if (roomJJ.cardsValue1[i].value == minValue / 10) {
                                array2.push(roomJJ.cardsValue1[i].card)

                                index = i

                            }
                        }
                        console.log(array2, "+++++hiiiiiiiiiiiiiiii+++++++++")
                        var randomIndex1 = Math.floor(Math.random() * array2.length);
                        var randomElement1 = array2[randomIndex1];
                        if (roomJJ.totalBetSum > 0) {
                            var is_beted = 1
                        } else {
                            var is_beted = 0
                        }
                        if (index != -1) {
                            io.to(roomId).emit("slot", randomElement1)

                            const apiUrl = "https://kheloindians.in/login/api/live-data-from-node";
                            const requestData = {
                                win_number: randomElement1.toString(),
                                game_name: "jeetoJoker",
                                win_price: roomJJ.winPrice,
                                is_beted: is_beted.toString()
                            };
                            console.log("Request Data:", requestData);
                            axios.post(apiUrl, requestData)
                                .then(response => {
                                    console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
                                })
                                .catch(error => {
                                    console.error(error, "++++++data nahi ayya error khaya++++++++"); // Print any errors
                                });


                        } else {
                            console.log("window should be increased")
                        }
                    
                }
   // highMedium----------
             async  function HighMedium(){
                console.log("+++++++no setMode is on+++++++++")
                console.log("+++++++++++++++++highMedium+++++++++++++++++++")
                function findCardsInRange(arr) {
                    let totalSum = roomJJ.totalBetSum

                    let lowerThreshold1 = 1.0 * totalSum;
                    let upperThreshold1 = 1.8 * totalSum;
                   


                    let cardsInRange = [];
                    let valueInRange = []

                    for (let i = 0; i < arr.length; i++) {
                        let card = arr[i];
                        let cardValue = card.value * 10;

                        if (cardValue >= lowerThreshold1 && cardValue <= upperThreshold1) {
                            cardsInRange.push(card.card);
                            valueInRange.push(cardValue)
                        }
                        

                    }



                    return { cardsInRange, valueInRange };
                }

                // Usage:

                let output = findCardsInRange(roomJJ.cardsValue1);
                console.log("The cards whose 10 times their value is within the specified ranges are:", output.cardsInRange);
                let minCardValue = output.valueInRange
                const randomIndex = Math.floor(Math.random() * minCardValue.length);
                console.log(minCardValue[randomIndex], "=========kiiiiiiiiiiiiiiiiiiiiiii+++++++++")
                let minValue = minCardValue[randomIndex]

                let index = -1;
                var array2 = []
                for (let i = 0; i < roomJJ.cardsValue1.length; i++) {
                    console.log("aaaaaaaaaaaaaaaaaaaaa==========+++++++++>")
                    roomJJ = await jeetoJokerRoom.findById(roomId)
                    if (roomJJ.cardsValue1[i].value == minValue / 10) {
                        array2.push(roomJJ.cardsValue1[i].card)

                        index = i

                    }
                }
                console.log(array2, "+++++hiiiiiiiiiiiiiiii+++++++++")
                var randomIndex1 = Math.floor(Math.random() * array2.length);
                var randomElement1 = array2[randomIndex1];
                if (roomJJ.totalBetSum > 0) {
                    var is_beted = 1
                } else {
                    var is_beted = 0
                }
                if (index != -1) {
              
                    io.to(roomId).emit("slot", randomElement1)

                    const apiUrl = "https://kheloindians.in/login/api/live-data-from-node";
                    const requestData = {
                        win_number: randomElement1.toString(),
                        game_name: "jeetoJoker",
                        win_price: roomJJ.winPrice,
                        is_beted: is_beted.toString()

                    };
                    console.log("Request Data:", requestData);
                    axios.post(apiUrl, requestData)
                        .then(response => {
                            console.log(response.data, "++++++++dada aagyaa++++++"); // Print the response data
                        })
                        .catch(error => {
                            console.error(error, "++++++data nahi ayya error khaya++++++++"); // Print any errors
                        });


                } else {
                console.log("+++++++++++++++++++medium++++++++++++++++++++++++++++++++")
                function findCardsInRange(arr) {
                    let totalSum = roomJJ.totalBetSum
                    console.log(totalSum, "++++++++++++totalSum+++++++++++")

                    let lowerThreshold3 = 0 * totalSum;
                    let upperThreshold3 = 1 * totalSum;
                    let cardsInRange = [];
                    let valueInRange = []

                    for (let i = 0; i < arr.length; i++) {
                        let card = arr[i];
                        let cardValue = card.value * 10;

                        if (cardValue >= lowerThreshold3 && cardValue <= upperThreshold3) {
                            cardsInRange.push(card.card);
                            valueInRange.push(cardValue)
                        }
                    }


                    return { cardsInRange, valueInRange };
                }
                // Usage:
                let output = findCardsInRange(roomJJ.cardsValue1);
                console.log("The cards whose 10 times their value is within the specified ranges are:", output.cardsInRange);
                let minCardValue = output.valueInRange
                const randomIndex = Math.floor(Math.random() * minCardValue.length);
                console.log(minCardValue[randomIndex], "=========kiiiiiiiiiiiiiiiiiiiiiii+++++++++")
                let minValue = minCardValue[randomIndex]
                let index = -1
                let roomPlayers = roomJJ.players;
                let player;
                var array2 = []
                for (let i = 0; i < roomJJ.cardsValue1.length; i++) {
                    roomJJ = await jeetoJokerRoom.findById(roomId)
                    if (roomJJ.cardsValue1[i].value == minValue / 10) {

                        array2.push(roomJJ.cardsValue1[i].card)

                        index = i

                    }
                }
                console.log(array2, "+++++hiiiiiiiiiiiiiiii+++++++++")
                var randomIndex1 = Math.floor(Math.random() * array2.length);
                var randomElement1 = array2[randomIndex1];
                if (roomJJ.totalBetSum > 0) {
                    var is_beted = 1
                } else {
                    var is_beted = 0
                }
                if (index != -1) {
                    io.to(roomId).emit("slot", randomElement1)

                    const apiUrl = "https://kheloindians.in/login/api/live-data-from-node";
                    const requestData = {
                        win_number: randomElement1.toString(),
                        game_name: "jeetoJoker",
                        win_price: roomJJ.winPrice,
                        is_beted: is_beted.toString()
                    };
                    console.log("Request Data:", requestData);

                    axios.post(apiUrl, requestData)
                        .then(response => {
                            console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
                        })
                        .catch(error => {
                            console.error(error, "++++++data nahi ayya error khaya++++++++"); // Print any errors
                        });


                }
                 
                }
               }
               //low------
               async function Low(){
                console.log("+++++++++++++++++low+++++++++++++++++++")
                function findCardsInRange(arr) {
                    let totalSum = roomJJ.totalBetSum

                    console.log(totalSum, "++++++++++totalSum++++++++++++")

                    let lowerThreshold1 = 0.0 * totalSum;
                    let upperThreshold1 = 1.0 * totalSum;

                    let cardsInRange = [];
                    let valueInRange = []

                    for (let i = 0; i < arr.length; i++) {
                        let card = arr[i];
                        let cardValue = card.value * 10;

                        if (cardValue >= lowerThreshold1 && cardValue <= upperThreshold1) {
                            console.log("++++++thresild 1++++++++++")
                            cardsInRange.push(card.card);
                            valueInRange.push(cardValue)
                        }
                    }


                    return { cardsInRange, valueInRange };
                }

                // Usage:

                let output = findCardsInRange(roomJJ.cardsValue1);
                console.log("The cards whose 10 times their value is within the specified ranges are:", output.cardsInRange);
                let minCardValue = output.valueInRange

           
                let minValue = Math.min(...minCardValue)
                let index = -1;
                var array2 = []
                for (let i = 0; i < roomJJ.cardsValue1.length; i++) {
                    if (roomJJ.cardsValue1[i].value == minValue / 10) {
                        array2.push(roomJJ.cardsValue1[i].card)
                        index = i

                    }
                }
                console.log(array2, "+++++hiiiiiiiiiiiiiiii+++++++++")
                var randomIndex1 = Math.floor(Math.random() * array2.length);
                var randomElement1 = array2[randomIndex1];
                if (roomJJ.totalBetSum > 0) {
                    var is_beted = 0
                } else {
                    var is_beted = 1
                }
                if (index != -1) {
                    io.to(roomId).emit("slot", randomElement1)
                    const apiUrl = "https://kheloindians.in/login/api/live-data-from-node";
                    const requestData = {
                        win_number: randomElement1.toString(),
                        game_name: "jeetoJoker",
                        win_price: roomJJ.winPrice,
                        is_beted: is_beted.toString()

                    };
                    console.log("Request Data:", requestData);
                    console.log(roomJJ.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++")
                    axios.post(apiUrl, requestData)
                        .then(response => {
                            console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
                        })
                        .catch(error => {
                            console.error(error, "++++++data nahi ayya error khaya++++++++"); // Print any errors
                        });


                } else {
                    console.log("window should be increased")
                }
               }


                if (roomJJ.mode == "none" || roomJJ.mode == "") {
                    let mode
                    if (mediumCounter < 3) {
                        mode = "Medium"
                        mediumCounter++
                        console.log("++++++++++pahle iske andar aagya+++++++++")

                    } else
                        if (mediumCounter == 3) {
                            mode = "HighMedium"
                            mediumCounter = 0
                            console.log("++++++++++ ab iske andar aagya+++++++++")

                        }

                    if (mode == "Medium") {
                        await MediumMode()

                    } else if (mode == "HighMedium") {
                       await HighMedium()
                    }
                } else {
                    if (roomJJ.mode === "High") {
                      await  HighMode()
                    } else if (roomJJ.mode === "Medium") {
                        MediumMode()
                    } else if (roomJJ.mode === "HighMedium") {
                       await HighMedium()
                    } else if (roomJJ.mode === "Low") {
                      await Low()
                    }
                }




                roomJJ.totalBetSum = 0;
                // roomJJ.mode = "none"

                roomJJ = await roomJJ.save()


                const cardValue = [

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
                ]

                for (let i = 0; i < roomJJ.players.length; i++) {
                    roomJJ.players[i].cardSetValue = cardValue
                }
                roomJJ.cardsValue1 = cardValue

                roomJJ = await roomJJ.save()

                console.log("Room Deleted")
                io.to(roomId).emit('roomMessage', "New Game Starting.");
                roomJJ = await roomJJ.save()
                await sleep(16000)
                roomJJ = await jeetoJokerRoom.findById(roomId)

            } while (roomJJ != null);



        } catch (error) {
            console.log(error)
        }
    })
    socket.on("bet", async (body) => {
        try {
            const data = JSON.parse(body);
            const { roomId, playerId, cardValueSet } = data;
            var roomJJ = await jeetoJokerRoom.findById({ _id: roomId });
            // Find player index
            const playerIndex = roomJJ.players.findIndex(element => element.playerId === playerId);
            if (playerIndex === -1) {
                console.log("Player not found");
                return;
            }
            // Update player's cardSetValue
            roomJJ.players[playerIndex].cardSetValue = cardValueSet;
            // Save the updated room document
            roomJJ = await roomJJ.save();
            io.to(roomId).emit("betInfo", { playerId: playerId, cardValueSet });
            io.to(roomId).emit("roomData", roomJJ);
        } catch (error) {
            console.log("Error:", error);
        }
    });
    socket.on("setMode", async (body) => {
        try {
            var roomId = body.roomId;
            var roomJJ = await jeetoJokerRoom.findById(roomId)
            var mode = body.mode
            var winPrice = body.winPrice
            if (roomJJ == null) {
                socket.emit('errorOccured', 'Wrong Room Id.');
                return;
            }
            roomJJ.mode = mode;
            roomJJ.winPrice = winPrice
            roomJJ = await roomJJ.save()

            console.log("===================>>>>>.", body)

            io.to(roomId).emit("mode", { mode: roomJJ.mode })
        } catch (error) {
            console.log(error)
        }
    })
    socket.on("leave", async (body) => {
        try {
            let roomId = body.roomId;
            let playerId = body.playerId;
            let roomJJ = await jeetoJokerRoom.findById(roomId)
            // await jeetoJokerRoom.findByIdAndDelete(roomId);

            roomJJ.players = roomJJ.players.filter((item) => {
                return item.playerId != playerId
            })
            roomJJ = await roomJJ.save()


        } catch (error) {
            console.log(error)
        }
    })
 

    socket.on("clearAll", async (body) => {
        try {
            await jeetoJokerRoom.deleteMany({});
        } catch (e) {
            console.log(e);
        }
    });

    /**
     * Disconnection Handler.
    **/
    socket.on("disconnect", async () => {

        try {
            console.log(`one socket disconnected:${socket.id}`);

        } catch (error) {
            console.log(error)
        }

    });



});


server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});