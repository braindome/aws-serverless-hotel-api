const {v4: uuidv4} = require('uuid')
//const fs = require('fs')

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const randomRoom = (index) => {
    const roomNumber = `${index}`
    const roomSize = randomIntFromInterval(1,3);
    const roomPrice = 500*roomSize;
    return{
        PutRequest:{
            Item: {
                id:uuidv4(),
                roomNumber:roomNumber,
                roomSize:roomSize,
                roomPrice:roomPrice,
            }
        }
    };
}

const generate = async () =>{
    const AWS = require('aws-sdk');
    AWS.config.update({region: "eu-north-1"});
    const documentClient = new AWS.DynamoDB.DocumentClient();
    
    const data = [];
    for(let i = 0;i <20;i++){
        data.push(randomRoom(i+1));
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

