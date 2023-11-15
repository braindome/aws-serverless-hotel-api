const AWS = require("aws-sdk");
const { sendResponse } = require("../../responses");
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    try {
      const bookingId = event.pathParameters.id; // Boknings-ID från pathParameters
  
      if (!bookingId) {
        return sendResponse(400, { success: false, message: "Missing booking ID" });
      }
  
      const params = {
        TableName: "hotel-db",
        Key: {
          id: bookingId,
        },
      };
  
      await db.delete(params).promise();
  
      return sendResponse(200, { success: true, message: "Booking deleted successfully" });
    } catch (error) {
      return sendResponse(500, { success: false, message: error.message });
    }
  };