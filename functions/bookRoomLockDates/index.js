import {SERVER} from "../../aws_module/index";
import { getDateRangeBetween } from "../query/helper";
const { v1: uuidv4 } = require("uuid");
const errDateMsg = "Invalid date range. Please provide valid checkInDate and checkOutDate in ISO format (e.g., 2023-12-23).";
const errPeopleToHoldMsg = (tot,max) =>{ `Total amount of people (${tot}) exceeds room capacity ${max}!`; }
const errMaxNumberOfNights = (tot) =>{ `Total amount of nights (${tot}) exceeds hotel limit (7)!`; }


/*
const testIdSingleRoom = "c9be8f60-9e5b-4dc5-8cd6-02374a977988";
const testIdDoubleRoom = "87278aea-d0ab-4a70-8e23-92dc6a346b8a";
const testIdSuiteRoom = "07e75b76-820a-441d-b054-5a6430800df8";
*/


exports.handler = async (event, context) => {
    const bookingDetails = JSON.parse(event.body);
    if(!validDateRange(bookingDetails.checkInDate,bookingDetails.checkOutDate)){ return sendResponse(400, {success: false,message:errDateMsg });}

    bookingDetails.id = uuidv4();
    //bookingDetails.numberOfGuests = bookingDetails.numberOfGuests;
    //bookingDetails.checkInDate = bookingDetails.checkInDate;
    //bookingDetails.checkOutDate = bookingDetails.checkOutDate;
    //bookingDetails.rooms = bookingDetails.rooms;
    //bookingDetails.referencePerson = bookingDetails.referencePerson;
    bookingDetails.numberOfRooms = `${bookingDetails.rooms.length}`;
    
    bookingDetails.GSI_PK_1 = "BOOKING#CONFIRMED";
    bookingDetails.GSI_SK_1 = bookingDetails.checkInDate;

    const numberOfDays = getNumberOfDaysBetween(bookingDetails.checkInDate,bookingDetails.checkOutDate);
    const stringOfDates = getDateRangeBetween(bookingDetails.checkInDate,bookingDetails.checkOutDate);
    var transactItems = [];
    var amountToPay = 0;
    var totalOfPeopleToHold = 0;
    transactItems.push(transactItemBooking(bookingDetails));


    bookingDetails.rooms.forEach((room) =>{
        amountToPay += parseInt(room.costPerNight) * numberOfDays;
        totalOfPeopleToHold += parseInt(room.quantity);
        transactItems.push(transactItemRoom(room.id,stringOfDates)); 
    })

    let params = { TransactItems:transactItems }

    if(totalOfPeopleToHold < parseInt(bookingDetails.numberOfGuests)){ 
        return SERVER.sendResponse(400, {success: false,message:errPeopleToHoldMsg(totalOfPeopleToHold,bookingDetails.numberOfGuests) });
    }

    if(stringOfDates.length > 7){ 
        return SERVER.sendResponse(400, {success: false,message:errMaxNumberOfNights(stringOfDates.length) });
    }

    try{
        await SERVER.documentClient.transactWrite(params).promise();
        return SERVER.sendResponse(200, { success: true, bookingConfirmation: bookingDetails });
      } catch(err) {
        return SERVER.sendResponse(500, { success: false,errorMessage:err });
      }
};


const transactItemBooking = (bookingDetails) =>{
    return{ 
        Put: {
            TableName: process.env.DYNAMO_DB_TABLE,
            Item: bookingDetails
        }
    }
}

const transactItemRoom = (id,dates) =>{
    return{ 
        Update: {
            TableName: process.env.DYNAMO_DB_TABLE,
            Key: { "id": id },
            UpdateExpression: "SET #dd = list_append(#dd, :dates)",
            ExpressionAttributeNames: { '#dd': 'bookedDates' },
            ExpressionAttributeValues:{ ':dates':dates}
        }
    }
}

const validDateRange = (checkIn, checkOut) => {
    const currentDate = new Date();
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
  
    if( isNaN(checkInDate) ||
        isNaN(checkOutDate) ||
        checkInDate < currentDate ||
        checkOutDate < currentDate ||
        checkInDate >= checkOutDate) { return false; }

    return true;
}

const getNumberOfDaysBetween = (from,to) =>{
    const d1 = new Date(from); 
    const d2 = new Date(to); 
    const diff = d2.getTime() - d1.getTime(); 

    return diff / (1000 * 3600 * 24); 
}