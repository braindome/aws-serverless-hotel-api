import {SERVER} from "../../aws_module/index";
import { transactItemRoom,findAvailableRooms,errBookingMissingRooms,errMaxNumberOfRooms,errDateRange,getNumberOfDaysBetween,validDateRange } from "../bookRoomLockDates";
import { getDateRangeBetween,addDays,oneYearAhead } from "../query/helper";
import { gsi_available_room_without_size } from "../query/gsi";
const errMissingPara = "Missing fields to update. At least one of [NumberOfGuests, CheckinDate, CheckOutDate or Rooms ] needs to be present, or at least be something else then already consists!";
const errBookingId = "ID does not match a booking in the system";
const errunExpectedRangeOfData = "Operation failed. Unexpected amounts of data to process! [ROOM_IDS]";

export const UPDATE_BOOKING_CONFIRMATION = Object.freeze({
    UPDATE_CHECK_IN:"UPDATE_CHECK_IN",
    UPDATE_CHECK_OUT:"UPDATE_CHECK_OUT",
    UPDATE_NUMBER_OF_GUESTS:"UPDATE_NUMBER_OF_GUESTS",
    UPDATE_ROOMS:"UPDATE_ROOMS",
});

exports.handler = async (event, context) => {
    const bookingId = event.pathParameters.id;
    if(!event.pathParameters.hasOwnProperty("id")){return SERVER.sendResponse(400, { success: false,errorMessage:errBookingId })}
    
    const currentBooking = { TableName: process.env.DYNAMO_DB_TABLE, Key: {id : bookingId}};
    let currentBookingDetails;
    let currentCheckInDate;
    let currentCheckOutDate;
    let currentRooms;
    try{
        const {Item} = await SERVER.documentClient.get(currentBooking).promise();
        if(Item === null){ return SERVER.sendResponse(400, { success: false,errorMessage:errBookingId }) }
        currentBookingDetails = Item;
        currentCheckInDate = Item.checkInDate;
        currentCheckOutDate = Item.checkOutDate;
        currentRooms = Item.rooms;
      } catch(err) {
        return SERVER.sendResponse(500, { success: false,errorMessage:err });
    }
    
    const updateBookingDetails = JSON.parse(event.body);
    const check = validateUpdatedBookingPart(updateBookingDetails,currentBookingDetails);

    if(!check.verified){ return SERVER.sendResponse(400, {success: false,message:check.msg });}

    const DYNAMO_TABLE_NAME = process.env.DYNAMO_DB_TABLE;
    let roomIds = [];
    let checkOutDateRemoveOne = addDays(currentCheckOutDate,-1).toISOString();
    let stringOfDates = getDateRangeBetween(currentCheckInDate,checkOutDateRemoveOne); 

    currentRooms.forEach((room) => { roomIds.push(room.id); })
    if(roomIds.length > 5 || stringOfDates > 7){return SERVER.sendResponse(400, {success: false,message:errunExpectedRangeOfData })}

    let data;
    try{
        const requestGetItems = getGetRequestItems(DYNAMO_TABLE_NAME,roomIds)
        data = (await SERVER.documentClient.batchGet(requestGetItems).promise()).Responses[DYNAMO_TABLE_NAME];
    }catch(err){ return SERVER.sendResponse(500, { success: false,errorMessage:err }); }

    let putRequests = [];
    data.forEach((room) =>{
        stringOfDates.forEach((date) =>{
            if(room.bookedDates.includes(date)){{
                const idx = room.bookedDates.indexOf(date);
                room.bookedDates.splice(idx,1);
            }}
        })
        putRequests.push(getPutRequestItem(room.id,room.bookedDates))
    })
    if(putRequests.length > 5){return SERVER.sendResponse(400, {success: false,message:errunExpectedRangeOfData })}

    if(putRequests.length > 0){
        const requestPutItems = getPutRequestItems(DYNAMO_TABLE_NAME,putRequests);
        try{
            const result = (await SERVER.documentClient.batchWrite(requestPutItems).promise());
        }catch(err){ return SERVER.sendResponse(500, { success: false,errorMessage:err }); }
    }
    
    checkOutDateRemoveOne = addDays(currentBookingDetails.checkOutDate,-1).toISOString();
    const numberOfDays = getNumberOfDaysBetween(currentBookingDetails.checkInDate,currentBookingDetails.checkOutDate);
    stringOfDates = getDateRangeBetween(currentBookingDetails.checkInDate,checkOutDateRemoveOne); 
    if(stringOfDates.length > 7){ return SERVER.sendResponse(400,{success:false,msg:errDateRange} )}
    
    let search;
    try{
        console.log(currentBookingDetails.rooms)
        const {Items} = await SERVER.documentClient.query(gsi_available_room_without_size(stringOfDates)).promise();
        search = findAvailableRooms(Items,currentBookingDetails.rooms);
    }catch(err){ return SERVER.sendResponse(500, { success: false,errorMessage:err }); }
    
    if(!search.found){return SERVER.sendResponse(400, {success: false,message:errBookingMissingRooms() });}

    let transactItems = [];
    let amountToPay = 0;
    
    search.rooms.forEach((room) =>{
        amountToPay += room.roomPrice * numberOfDays;
        transactItems.push(transactItemRoom(room.id,stringOfDates)); 
    })
    if(transactItems.length > 6){ return SERVER.sendResponse(400, {success: false,message:errMaxNumberOfRooms(transactItems.length) });}

    currentBookingDetails.amountToPay = amountToPay;
    try{
        const params = { TransactItems:transactItems }
        await SERVER.documentClient.transactWrite(params).promise();
    } catch(err) { return SERVER.sendResponse(500, { success: false,errorMessage:err });}
 
    const expr = filterExpressionAndExpressionAttributeToUpdate(check.updates,currentBookingDetails);
    const updateParam = {
        TableName: process.env.DYNAMO_DB_TABLE,
        Key: { "id": bookingId },
        UpdateExpression: expr.updateExpression,
        ExpressionAttributeValues: expr.expressionAttribute
    };
    
    try{
        await SERVER.documentClient.update(updateParam).promise();
        return SERVER.sendResponse(200, { success: true, bookingConfirmation: bookingDetailsConfirmation(check.updates,currentBookingDetails,updateBookingDetails)});
      } catch(err) { return SERVER.sendResponse(500, { success: false,errorMessage:err }); }
};

const validateUpdatedBookingPart = (updateBookingDetails,currentBookingDetails) =>{
    const updates = [];
    const errors = [];
    let forceUpdateOfRooms = true;
    if(typeof updateBookingDetails !== "object"){return {verified:false,msg:"OBJECT_FAILED"};}
    if(updateBookingDetails.hasOwnProperty("checkInDate")){
        if(validDate(updateBookingDetails.checkInDate)){ 
            if(currentBookingDetails.checkInDate !== updateBookingDetails.checkInDate){
                currentBookingDetails.checkInDate = updateBookingDetails.checkInDate;
                updates.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_IN); 
            }
        }
        else{errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_IN);}
    }
    if(updateBookingDetails.hasOwnProperty("checkOutDate")){
        if(validDate(updateBookingDetails.checkOutDate)){ 
            if(currentBookingDetails.checkOutDate !== updateBookingDetails.checkOutDate){
                currentBookingDetails.checkOutDate = updateBookingDetails.checkOutDate;
                updates.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_OUT); 
            }
        }
        else{ errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_OUT);}
    }
    if(updateBookingDetails.hasOwnProperty("numberOfGuests")){
        if(parseInt(updateBookingDetails.numberOfGuests)){ 
            if(currentBookingDetails.numberOfGuests.toString() !== updateBookingDetails.numberOfGuests.toString()){
                currentBookingDetails.numberOfGuests = parseInt(updateBookingDetails.numberOfGuests);
                updates.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_NUMBER_OF_GUESTS); 
            }
        } 
        else{ errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_NUMBER_OF_GUESTS);}
    }

    if(updateBookingDetails.hasOwnProperty("rooms")){
        if(updateBookingDetails.rooms.length > 0){
            let totalCapacity = 0;
            let totalRooms = 0;
            updateBookingDetails.rooms.forEach((room) =>{
                if(room.hasOwnProperty("roomSize") && parseInt(room.roomSize) && 
                   room.hasOwnProperty("quantity") && parseInt(room.quantity)){
                    totalCapacity += parseInt(room.roomSize) * parseInt(room.quantity);
                    totalRooms += parseInt(room.quantity);
                }
                else{ errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_ROOMS); }
            })

            if(totalCapacity < currentBookingDetails.numberOfGuests){errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_ROOMS);}
            
            let totalCapacityCurr = 0;
            let totalRoomsCurr = 0;
            currentBookingDetails.rooms.forEach((room) =>{
                if(room.hasOwnProperty("roomSize") && parseInt(room.roomSize)){
                    totalCapacityCurr += parseInt(room.roomSize);
                    totalRoomsCurr += 1;
                }
            })

            if(totalCapacityCurr !== totalCapacity || totalRoomsCurr !== totalRooms){
                forceUpdateOfRooms = false;
                currentBookingDetails.numberOfRooms = totalRooms;
                currentBookingDetails.rooms = updateBookingDetails.rooms;
                updates.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_ROOMS);
            }
        } 
        else{ errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_ROOMS); }
    }

    if(!validDateRange(currentBookingDetails.checkInDate,currentBookingDetails.checkOutDate)){
        errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_IN,UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_OUT);
    }
  
    if(errors.length > 0){ 
        let msg = "Unable to proceed with booking updates, encountered following errors -> ";
        errors.forEach((err) =>{ msg += ` ${err}`; })
        return{verified:false,msg:msg}
    }

    if(updates.length <= 0){ return{verified:false,msg:errMissingPara} }

    if(forceUpdateOfRooms){
        let roomRequested = [0,0,0,0,0,0];
        let rooms = [];
        currentBookingDetails.rooms.forEach((room) =>{
            const roomSize = parseInt(room.roomSize);
            if(0 < roomSize && roomSize <= 5){
                roomRequested[roomSize] += 1;
            }
        })
        roomRequested.forEach((quantity,roomSize) =>{
            if(quantity > 0){
                rooms.push({
                    "roomSize": roomSize,
					"quantity": quantity
                })
            }
        })
        currentBookingDetails.rooms = rooms;
    }

    return{verified:true,updates:updates}
}

const filterExpressionAndExpressionAttributeToUpdate  = (updateBookingWith,Item) =>{
    var updateExpression = "set"
    var expressionAttribute = {}
    updateBookingWith.forEach((data,i) =>{
        switch(data){
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_IN: 
                updateExpression += " checkInDate = :cid,GSI_SK_1 = :gs_sk_1";
                expressionAttribute[":cid"] = Item.checkInDate;
                expressionAttribute[":gs_sk_1"] = Item.checkInDate;
               break;
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_OUT: 
                updateExpression += " checkOutDate = :cod";
                expressionAttribute[":cod"] = Item.checkOutDate;
                break;
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_NUMBER_OF_GUESTS:
                updateExpression += " numberOfGuests = :nog";
                expressionAttribute[":nog"] = Item.numberOfGuests;
                break;
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_ROOMS:
                updateExpression += " rooms = :r";
                expressionAttribute[":r"] = Item.rooms;
                break;
            default:break;
        }
        if(i < updateBookingWith.length - 1){ updateExpression += ",";}
   })
   return {updateExpression:updateExpression,expressionAttribute:expressionAttribute}
}

const bookingDetailsConfirmation = (updates,currentBookingDetails,updateBookingDetails) =>{
    return [{
            BookingDetails:{
                BookingID:currentBookingDetails.id,
                Guests:currentBookingDetails.numberOfGuests,
                Rooms:currentBookingDetails.numberOfRooms,
                AmountToPay:currentBookingDetails.amountToPay,
                CheckInDate:currentBookingDetails.checkInDate,
                CheckOutDate:currentBookingDetails.checkOutDate,
                Reference:currentBookingDetails.referencePerson.name
            },
            UpdatedDetails:updatedBookingDetails(updates,updateBookingDetails)
        }
    ]
}

const updatedBookingDetails = (updates,updateBookingDetails) =>{
    var response = {};
    updates.forEach((data) =>{
        switch(data){
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_IN: 
                response["CheckInDate"] = updateBookingDetails.checkInDate;
                break;
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_OUT: 
                response["CheckOutDate"] = updateBookingDetails.checkOutDate;
                break;
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_NUMBER_OF_GUESTS:
                response["NumberOfGuests"] = updateBookingDetails.numberOfGuests;
                break;
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_ROOMS:
                response["Rooms"] = updateBookingDetails.rooms;
                break;
            default:
                response["Undefined"] = "We encountered something strange!"
                break;
        }
    })
    return response;
}


const getGetRequestItems = (tableName,ids) =>{
    return {
        RequestItems: {
            [tableName]: {
              Keys: ids.map(id => ({["id"]: id}))
            }
        }
    }
}

const getPutRequestItems = (tableName,data) =>{
    return { RequestItems: { [tableName]: data} }
}

const getPutRequestItem = (id,dates) =>{
    return {
        PutRequest: {
            Item: {
              ["id"]: id,
              bookedDates: dates,
           },
          }
    }
}

const validDate = (date) => {
    const currentDate = new Date();
    const checkDate = new Date(date);
    const maxCheckOutDate = oneYearAhead();
  
    if( isNaN(checkDate) ||
        checkDate < currentDate ||
        checkDate > maxCheckOutDate) { return false; }

    return true;
}
