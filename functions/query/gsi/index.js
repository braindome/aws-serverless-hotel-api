export const gsi_room_by_size = (roomSize) =>{
    return{
        TableName: process.env.DYNAMO_DB_TABLE,
        IndexName: process.env.GSI_ROOM_BY_ROOM_SIZE,
        KeyConditionExpression:"#pk = :pk",
        ExpressionAttributeNames: {"#pk":"roomSize"},
        ExpressionAttributeValues:{":pk": roomSize},
        ScanIndexForward:false,
    };
}

export const gsi_active_bookings = () =>{
    return allConfirmedBookings();
}

export const gsi_active_bookings_with_date_range = (dateRange) =>{
    return allConfirmedBookingsWithCheckInDateAndCheckOutDate(dateRange.checkInDate,dateRange.checkOutDate);
    //if("checkInDate" in dateRange && "checkOutDate" in dateRange){return allConfirmedBookingsWithCheckInDateAndCheckOutDate(dateRange.checkInDate,dateRange.checkOutDate);}
    //if("checkInDate" in dateRange){return allConfirmedBookingsWithCheckInDate(dateRange.checkInDate);}
    //if("checkOutDate" in dateRange){return allConfirmedBookingsWithCheckOutDate(dateRange.checkOutDate);}
}

//GSI_GENERIC_PK_SK="GSI_GENERIC_PK_SK"
const allConfirmedBookings = () =>{
    return{
        TableName: process.env.DYNAMO_DB_TABLE,
        IndexName: process.env.GSI_GENERIC_PK_SK,
        KeyConditionExpression:"#pk = :pk",
        ProjectionExpression: "id, checkInDate, checkOutDate, numberOfGuests,numberOfRooms,referencePerson.#n",
        ExpressionAttributeNames: {"#pk":"GSI_PK_1","#n":"name"},
        ExpressionAttributeValues:{":pk": "BOOKING#CONFIRMED"},
        ScanIndexForward:false,
    };
}

const allConfirmedBookingsWithCheckInDateAndCheckOutDate = (checkInDate,checkOutDate) =>{
    return{
        TableName: process.env.DYNAMO_DB_TABLE,
        IndexName: process.env.GSI_GENERIC_PK_SK,
        KeyConditionExpression:"#pk = :pk AND #sk BETWEEN :sk1 AND :sk2",
        ProjectionExpression: "id, checkInDate, checkOutDate, numberOfGuests,numberOfRooms,referencePerson.#n",
        ExpressionAttributeNames: {"#pk":"GSI_PK_1","#sk":"GSI_SK_1","#n":"name"},
        ExpressionAttributeValues:{":pk": "BOOKING#CONFIRMED",":sk1":checkInDate,":sk2":checkOutDate},
        ScanIndexForward:false,
    };
}

const allConfirmedBookingsWithCheckInDate = (checkInDate) =>{
    return{
         TableName: process.env.DYNAMO_DB_TABLE,
         IndexName: process.env.GSI_GENERIC_PK_SK,
         KeyConditionExpression:"#pk = :pk AND #sk GE :sk",
         ProjectionExpression: "id, checkInDate, checkOutDate, numberOfGuests,numberOfRooms,referencePerson.#n",
         ExpressionAttributeNames: {"#pk":"GSI_PK_1","#sk":"GSI_SK_1","#n":"name"},
         ExpressionAttributeValues:{":pk": "BOOKING#CONFIRMED",":sk":checkInDate},
         ScanIndexForward:false,
     };
 }
 
 const allConfirmedBookingsWithCheckOutDate = (checkOutDate) =>{
     const checkInDate = addDays(checkOutDate,-1);
     return{
         TableName: process.env.DYNAMO_DB_TABLE,
         IndexName: process.env.GSI_GENERIC_PK_SK,
         KeyConditionExpression:"#pk = :pk AND #sk LE :sk1",
         ProjectionExpression: "id, checkInDate, checkOutDate, numberOfGuests,numberOfRooms,referencePerson.#n",
         FilterExpression:"checkOutDate LE :sk2",
         ExpressionAttributeNames: {"#pk":"GSI_PK_1","#sk":"GSI_SK_1","#n":"name"},
         ExpressionAttributeValues:{":pk": "BOOKING#CONFIRMED",":sk1":checkOutDate,":sk2":checkOutDate},
         ScanIndexForward:false,
     };
 }



const addDays = function(str, days) {
    var myDate = new Date(str);
    myDate.setDate(myDate.getDate() + parseInt(days));
    return myDate;
}
