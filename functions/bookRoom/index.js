import { sendResponse } from "../../responses";

const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const { v1: uuidv1 } = require("uuid");

const uuidTest = uuidv1();
console.log(uuidTest);

function validateDate(checkIn, checkOut) {
  // Convert string dates to Date objects
  const currentDate = new Date();
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Validate the dates
  if (
    isNaN(checkInDate) ||
    isNaN(checkOutDate) ||
    checkInDate < currentDate ||
    checkOutDate < currentDate ||
    checkInDate >= checkOutDate
  ) {
    return sendResponse(400, {
      success: false,
      message:
        "Invalid date range. Please provide valid checkInDate and checkOutDate in ISO format (e.g., 2023-12-23).",
    });
  }
}

function calculateTotalCost(rooms, checkOut, checkIn) {
  let totalCost = 0;

  rooms.forEach(room => {
    let costPerNight;

    switch (room.type.toLowerCase()) {
      case "single":
        costPerNight = 500;
        break;
      case "double":
        costPerNight = 1000;
        break;
      case "suite":
        costPerNight = 1500;
        break;
      default:
        costPerNight = 0;
    }

    totalCost += costPerNight * Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) /
        (1000 * 60 * 60 * 24)
    );
  });

  return totalCost;
}

function validateGuests(rooms, totalGuests) {
  let totalExpectedGuests = 0;

  rooms.forEach(room => {
    switch (room.type.toLowerCase()) {
      case "single":
        totalExpectedGuests += 1;
        break;
      case "double":
        totalExpectedGuests += 2;
        break;
      case "triple":
        totalExpectedGuests += 3;
        break;
      default:
        totalExpectedGuests = 0
    }
  });

  if (totalGuests !== totalExpectedGuests) {
    return sendResponse(400, {
      success: false,
      message: "Invalid number of guests. Please check the number of guests based on the room types.",
    });
  }
}

exports.handler = async (event, context) => {
  const bookingDetails = JSON.parse(event.body);

  bookingDetails.id = uuidv1();
  bookingDetails.numberOfGuests = bookingDetails.numberOfGuests;
  bookingDetails.checkInDate = bookingDetails.checkInDate;
  bookingDetails.checkOutDate = bookingDetails.checkOutDate;
  bookingDetails.rooms = bookingDetails.rooms;
  bookingDetails.referencePerson = bookingDetails.referencePerson;

  validateDate(bookingDetails.checkInDate, bookingDetails.checkOutDate);
  const guestsValidationResult = validateGuests(bookingDetails.rooms, bookingDetails.numberOfGuests);

  if (guestsValidationResult) {
    return guestsValidationResult;
  }

  bookingDetails.numberOfRooms = `${bookingDetails.rooms.length}`;
  bookingDetails.GSI_PK_1 = "BOOKING#CONFIRMED";
  bookingDetails.GSI_SK_1 = bookingDetails.checkInDate;


  const totalCost = calculateTotalCost(bookingDetails.rooms, bookingDetails.checkOutDate, bookingDetails.checkInDate);
  bookingDetails.totalCost = totalCost;

  try {
    await db
      .put({
        TableName: "hotel-db",
        Item: bookingDetails,
      })
      .promise();
    return sendResponse(200, {
      success: true,
      bookingConfirmation: bookingDetails,
    });
  } catch (error) {
    return sendResponse(500, {
      success: false,
    });
  }
};
