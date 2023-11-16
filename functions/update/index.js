import {SERVER} from "../../aws_module/index";
const errMissingPara = "Missing fields to update. At least one of [NumberOfGuests, CheckinDate, CheckOutDate or Rooms ] needs to be present.";
const errBookingId = "ID does not match a booking in the system";

export const UPDATE_BOOKING_CONFIRMATION = Object.freeze({
    UPDATE_CHECK_IN:"UPDATE_CHECK_IN",
    UPDATE_CHECK_OUT:"UPDATE_CHECK_OUT",
    UPDATE_NUMBER_OF_GUESTS:"UPDATE_NUMBER_OF_GUESTS",
    UPDATE_ROOMS:"UPDATE_ROOMS",
});

exports.handler = async (event, context) => {
    const bookingId = event.pathParameters.id;
    const updateBookingDetails = JSON.parse(event.body);
    const check = validateUpdatedBooking(updateBookingDetails);

    const currentBooking = {
        TableName: process.env.DYNAMO_DB_TABLE,
        Key: {id : bookingId}
    };
    try{
        const {Item} = await SERVER.documentClient.get(currentBooking).promise();
        if(Item === null){ return SERVER.sendResponse(400, { success: false,errorMessage:errBookingId }) }
      } catch(err) {
        return SERVER.sendResponse(500, { success: false,errorMessage:err });
    }
    
    if(!check.verified){ return SERVER.sendResponse(400, {success: false,message:check.msg });}
    const expr = filterExpressionAndExpressionAttributeToUpdate(check.updates,updateBookingDetails);
    const updateParam = {
        TableName: process.env.DYNAMO_DB_TABLE,
        Key: { "id": bookingId },
        UpdateExpression: expr.updateExpression,
        ExpressionAttributeValues: expr.expressionAttribute
    };
    
    try{
        await SERVER.documentClient.update(updateParam).promise();
        return SERVER.sendResponse(200, { success: true, bookingConfirmation: updatedBookingDetailsConfirmation(check.updates,updateBookingDetails)});
      } catch(err) {
        return SERVER.sendResponse(500, { success: false,errorMessage:err });
    }
};


const validDate = (date) => {
    const currentDate = new Date();
    const checkDate = new Date(date);
    const maxCheckOutDate = new Date("2024-12-31");
  
    if( isNaN(checkDate) ||
        checkDate < currentDate ||
        checkDate > maxCheckOutDate) { return false; }

    return true;
}

const validateUpdatedBooking = (updateBookingDetails) =>{
    const updates = [];
    const errors = [];
    if(typeof updateBookingDetails !== "object"){return {verified:false,msg:"OBJECT_FAILED"};}
    if(updateBookingDetails.hasOwnProperty("checkInDate")){
        if(validDate(updateBookingDetails.checkInDate)){ updates.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_IN); }
        else{errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_IN);}
    }
    if(updateBookingDetails.hasOwnProperty("checkOutDate")){
        if(validDate(updateBookingDetails.checkOutDate)){ updates.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_OUT); }
        else{ errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_OUT);}
    }
    if(updateBookingDetails.hasOwnProperty("numberOfGuests")){
        if(parseInt(updateBookingDetails.numberOfGuests)){ updates.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_NUMBER_OF_GUESTS); } 
        else{ errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_NUMBER_OF_GUESTS);}
    }
    if(updateBookingDetails.hasOwnProperty("rooms")){
        if(updateBookingDetails.rooms.length <= 0){errors.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_ROOMS);} 
        else{ updates.push(UPDATE_BOOKING_CONFIRMATION.UPDATE_ROOMS); }
    }
    if(errors.length > 0){ 
        let msg = "Unable to proceed with booking updates, encountered following errors -> ";
        errors.forEach((err) =>{
            msg += ` ${err}`;
        })
        return{verified:false,msg:msg}
    }
    if(updates.length > 0){ 
        return{verified:true,updates:updates}
    }
    return{verified:false,msg:errMissingPara}
}

const filterExpressionAndExpressionAttributeToUpdate  = (updateBookingWith,updateBookingDetails) =>{
    var updateExpression = "set"
    var expressionAttribute = {}
    updateBookingWith.forEach((data,i) =>{
        switch(data){
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_IN: 
                updateExpression += " checkInDate = :cid,GSI_SK_1 = :gs_sk_1";
                expressionAttribute[":cid"] = updateBookingDetails.checkInDate;
                expressionAttribute[":gs_sk_1"] = updateBookingDetails.checkInDate;
                break;
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_CHECK_OUT: 
                updateExpression += " checkOutDate = :cod";
                expressionAttribute[":cod"] = updateBookingDetails.checkOutDate;
                break;
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_NUMBER_OF_GUESTS:
                updateExpression += " numberOfGuests = :nog";
                expressionAttribute[":nog"] = updateBookingDetails.numberOfGuests;
                break;
            case UPDATE_BOOKING_CONFIRMATION.UPDATE_ROOMS:
                updateExpression += " rooms = :r";
                expressionAttribute[":r"] = updateBookingDetails.rooms;
                break;
            default:break;
        }
        if(i < updateBookingWith.length - 1){ updateExpression += ",";}
   })
   return {updateExpression:updateExpression,expressionAttribute:expressionAttribute}
}

const updatedBookingDetailsConfirmation = (updates,updateBookingDetails) =>{
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
                response["Rooms"] = updateBookingDetails.rooms.length;
                break;
            default:
                response["Undefined"] = "We encountered something strange!"
                break;
        }
    })
    return response;
}
