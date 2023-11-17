import {SERVER} from "../../aws_module/index";
import { gsi_available_room_without_size } from "../query/gsi";
import { getDateRangeBetween,addDays,oneYearAhead } from "../query/helper";
const { v1: uuidv4 } = require("uuid");

export const errPeopleToHoldMsg = (tot,max) =>{ return `Total amount of people (${tot}) exceeds room capacity ${max}!`; }
export const errMaxNumberOfNights = (tot) =>{ return `Total amount of nights (${tot}) exceeds hotel limit (7)!`; }
export const errBookingMissingRooms = () =>{ return `Booking failed. We dont have all the requested rooms available!`; }
export const errMaxNumberOfRooms = (tot) =>{ return `Total amount of rooms (${tot}) exceeds hotel limit (5)!`; }
export const errDateRange = "Period exceeds max number of nights [7]"

export const BOOKING_CONFIRMATION = Object.freeze({
    OBJECT_FAILED:"OBJECT_FAILED",
    DATE_FAILED:"DATE_FAILED",
    NUMBER_OF_GUESTS_FAILED:"NUMBER_OF_GUESTS_FAILED",
    ROOMS_FAILED:"ROOMS_FAILED",
    REFERENCE_PERSON_FAILED:"REFERENCE_PERSON_FAILED",
});

exports.handler = async (event, context) => {
    const bookingDetails = JSON.parse(event.body);
    const result = validateBooking(bookingDetails); 
    if(!result.verified){ return SERVER.sendResponse(400, {success: false,message:result.msg });}

    const checkOutDateRemoveOne = addDays(bookingDetails.checkOutDate,-1).toISOString();
    const numberOfDays = getNumberOfDaysBetween(bookingDetails.checkInDate,bookingDetails.checkOutDate);
    const stringOfDates = getDateRangeBetween(bookingDetails.checkInDate,checkOutDateRemoveOne); 
   
    if(stringOfDates.length > 7){ return SERVER.sendResponse(400,{success:false,msg:errDateRange} )}

    let search;
    try{
        const {Items} = await SERVER.documentClient.query(gsi_available_room_without_size(stringOfDates)).promise();
        search = findAvailableRooms(Items,bookingDetails.rooms);
    }catch(err){ return SERVER.sendResponse(500, { success: false,errorMessage:err }); }
    

    if(!search.found){return SERVER.sendResponse(400, {success: false,message:errBookingMissingRooms() });}
  
    bookingDetails.id = uuidv4();
    bookingDetails.rooms = search.rooms;
    bookingDetails.numberOfRooms = search.rooms.length;
    
    bookingDetails.GSI_PK_1 = "BOOKING#CONFIRMED";
    bookingDetails.GSI_SK_1 = bookingDetails.checkInDate;

    let transactItems = [];
    let amountToPay = 0;
    let totalOfPeopleToHold = 0;

    transactItems.push(transactItemBooking(bookingDetails));

    bookingDetails.rooms.forEach((room) =>{
        amountToPay += room.roomPrice * numberOfDays;
        totalOfPeopleToHold += room.roomSize;
        transactItems.push(transactItemRoom(room.id,stringOfDates)); 
    })

    bookingDetails.amountToPay = amountToPay;
    let params = { TransactItems:transactItems }

    if(totalOfPeopleToHold < parseInt(bookingDetails.numberOfGuests)){ 
        return SERVER.sendResponse(400, {success: false,message:errPeopleToHoldMsg(totalOfPeopleToHold,bookingDetails.numberOfGuests) });
    }
    if(transactItems.length <= 0 || transactItems.length > 6){ 
        return SERVER.sendResponse(400, {success: false,message:errMaxNumberOfRooms(transactItems.length) });
    }
    try{
        await SERVER.documentClient.transactWrite(params).promise();
        return SERVER.sendResponse(200, { success: true, bookingConfirmation: bookingDetailsConfirmation(bookingDetails)});
      } catch(err) { return SERVER.sendResponse(500, { success: false,errorMessage:err }); }

   
};


export const findAvailableRooms = (availableRooms,roomsRequested) =>{
    const roomToFind = [];
    const roomsFound = []
    roomsRequested.map((room) =>{ 
        const quantity = parseInt(room.quantity);
        for(let i = 0;i < quantity && quantity < 20;i++){ 
            roomToFind.push(parseInt(room.roomSize)); 
        }
    })
    const roomCountToMatch = roomToFind.length;
    const loopEnd = Math.min(20,availableRooms.length);
    for(let i = 0;i < loopEnd && roomToFind.length > 0; i++){
        const room = availableRooms[i];
        if(roomToFind.includes(room.roomSize)){{
            roomsFound.push(room);
            const idx = roomToFind.indexOf(room.roomSize);
            roomToFind.splice(idx,1);
        }}
    }
    const didmatch = (roomCountToMatch === roomsFound.length) && roomCountToMatch > 0;
    return {found:didmatch,rooms:roomsFound};
}

const bookingDetailsConfirmation = (bookingDetails) =>{
    return {
        BookingID:bookingDetails.id,
        Guests:bookingDetails.numberOfGuests,
        Rooms:bookingDetails.numberOfRooms,
        AmountToPay:bookingDetails.amountToPay,
        CheckInDate:bookingDetails.checkInDate,
        CheckOutDate:bookingDetails.checkOutDate,
        Reference:bookingDetails.referencePerson.name
    }
}

const transactItemBooking = (bookingDetails) =>{
    return{ 
        Put: {
            TableName: process.env.DYNAMO_DB_TABLE,
            Item: bookingDetails
        }
    }
}

export const transactItemRoom = (id,dates) =>{
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

const validateBooking = (bookingDetails) =>{
    const errors = [];
    let msg = "Booking failed: [ Missing information] -> ";
    if(typeof bookingDetails !== "object"){ errors.push(BOOKING_CONFIRMATION.OBJECT_FAILED); }
    else{
        if(!validDateRange(bookingDetails.checkInDate,bookingDetails.checkOutDate)){ errors.push(BOOKING_CONFIRMATION.DATE_FAILED); }
        if(!bookingDetails.hasOwnProperty("numberOfGuests") || isNaN(parseInt(bookingDetails.numberOfGuests))){ errors.push(BOOKING_CONFIRMATION.NUMBER_OF_GUESTS_FAILED); }
        if(!bookingDetails.hasOwnProperty("rooms") || bookingDetails.rooms.length <= 0){ errors.push(BOOKING_CONFIRMATION.ROOMS_FAILED); }
        if(!bookingDetails.hasOwnProperty("referencePerson")){ errors.push(BOOKING_CONFIRMATION.REFERENCE_PERSON_FAILED); }
    }
    
    
    if(errors.length > 0){ 
        errors.forEach((err) =>{
            msg += `[ ${err} ]`
        })
        return{verified:false,msg:msg}
    }
    return{verified:true}
}

export const validDateRange = (checkIn, checkOut) => {
    const currentDate = new Date();
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const maxCheckOutDate = oneYearAhead();
  
    if( isNaN(checkInDate) ||
        isNaN(checkOutDate) ||
        checkInDate < currentDate ||
        checkOutDate < currentDate ||
        checkInDate >= checkOutDate || 
        checkOutDate > maxCheckOutDate) { return false; }

    return true;
}

export const getNumberOfDaysBetween = (from,to) =>{
    const d1 = new Date(from); 
    const d2 = new Date(to); 
    const diff = d2.getTime() - d1.getTime(); 

    return diff / (1000 * 3600 * 24); 
}