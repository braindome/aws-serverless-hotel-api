import { sendResponse } from "../../responses";

const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const { v1: uuidv1 } = require("uuid");

exports.handler = async (event, context) => {
    const room = JSON.parse(event.body);

    room.id = room.id;
    room.roomNumber = room.roomNumber;
    room.roomSize = room.roomSize;
    room.roomPrice = room.roomPrice;
    room.GSI_PK_1 = room.GSI_PK_1;
    room.GSI_SK_1 = room.GSI_SK_1;
    room.bookedDates = []
  

  
    try {
      await db
        .put({
          TableName: "hotel-db",
          Item: room,
        })
        .promise();
      return sendResponse(200, {
        success: true,
      });
    } catch (error) {
      return sendResponse(500, {
        success: false,
      });
    }
  };
  