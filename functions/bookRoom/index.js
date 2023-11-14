import { sendResponse } from "../../responses";

const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const { v1: uuidv1 } = require("uuid");

const uuidTest = uuidv1();
console.log(uuidTest);

exports.handler = async (event, context) => {
  const bookingDetails = JSON.parse(event.body);

  bookingDetails.id = uuidv1();
  bookingDetails.numberOfGuests = bookingDetails.numberOfGuests;
  bookingDetails.checkInDate = bookingDetails.checkInDate;
  bookingDetails.checkOutDate = bookingDetails.checkOutDate;
  bookingDetails.rooms = bookingDetails.rooms;
  bookingDetails.referencePerson = bookingDetails.referencePerson;


  try {
    await db
      .put({
        TableName: "hotel-db",
        Item: bookingDetails,
      })
      .promise();
    return sendResponse(200, {
      success: true,
      bookingConfirmation: bookingDetails
    });
  } catch (error) {
    return sendResponse(500, {
      success: false,
    });
  }
};
