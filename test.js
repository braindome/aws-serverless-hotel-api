const {v4: uuidv4} = require('uuid')


function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const randomRoom = (index) => {
    const roomNumber = `${index}`
    const roomSize = randomIntFromInterval(1,3);
    const roomPrice = 500*roomSize;
    const id = uuidv4();
    return{
        PutRequest:{
            Item: {
                id:id,
                roomNumber:roomNumber,
                roomSize:roomSize,
                roomPrice:roomPrice,
                GSI_PK_1:  "ROOM",
                GSI_SK_1: `${roomSize}`,
                bookedDates:[],
            }
        }
    };
}

const generate = async () =>{
    const data = [];
    for(let i = 0;i <20;i++){
        data.push(randomRoom(i+1));
    }

    console.log(data);
    data.forEach((item) =>{
        console.log(item);
    })


}


generate();