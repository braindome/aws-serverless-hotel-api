const {v4: uuidv4} = require('uuid')
//const fs = require('fs')

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const randomBooking = () => {
    return{
        PutRequest:{
            Item: {
                id:uuidv4(),
                numberOfGuests: "3",
                checkInDate: "2023-11-16",
                checkOutDate: "2023-11-23",
                numberOfRooms: "3",
                totalAmountToPay: "21000",
                GSI_PK_1: "BOOKING#CONFIRMED",
                GSI_SK_1: "2023-11-16",
                rooms: [
                    {
                        id:"c9be8f60-9e5b-4dc5-8cd6-02374a977988",
                        type: "single",
                        quantity: 1,
                        costPerNight: 500
                    },
                    {
                        id:"87278aea-d0ab-4a70-8e23-92dc6a346b8a",
                        type: "double",
                        quantity: 2,
                        costPerNight: 1000
                    },
                    {
                        id:"07e75b76-820a-441d-b054-5a6430800df8",
                        type: "suite",
                        quantity: 3,
                        costPerNight: 1500
                    }
                ],
                referencePerson: {
                    name: "Fredrik Sundström",
                    email: "fredrik@heatia.se"
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


//generate();

