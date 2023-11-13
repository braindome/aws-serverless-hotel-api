const {v4: uuidv4} = require('uuid')
//const fs = require('fs')

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const randomBooking = () => {
    const PUT_ACTUAL_ROOM_ID_HERE = "123456789"
    const ALSO_HERE = "123456789"
    return{
        PutRequest:{
            Item: {
                id:uuidv4(),
                numberOfGuests: "3",
                checkInDate: "2023-11-15",
                checkOutDate: "2023-11-20",
                rooms: [
                    {
                        id:PUT_ACTUAL_ROOM_ID_HERE,
                        type: "single",
                        quantity: 2,
                        costPerNight: 500
                    },
                    {
                        id:ALSO_HERE,
                        type: "double",
                        quantity: 1,
                        costPerNight: 1000
                    }
                ],
                referencePerson: {
                    name: "John Doe",
                    email: "john.doe@example.com"
                }
           }
        }
    };
}

const generate = async () =>{
    const AWS = require('aws-sdk');
    AWS.config.update({region: "eu-north-1"});
    const documentClient = new AWS.DynamoDB.DocumentClient();
    
    const data = [];
    for(let i = 0;i <1;i++){
        data.push(randomBooking());
    }

    //let json = JSON.stringify(data);
    //fs.writeFileSync('rooms.json',json);
    
    let params = {
        RequestItems: {
          [process.env.DYNAMO_DB_TABLE]: data
        },
      }

    await documentClient.batchWrite(params,(err,data) =>{
        if(err){console.log(err);}
        else{console.log(`added ${data.length} rooms` );}
    }).promise();
         
}

// UNCOMMENT TO POPULATE
//generate();