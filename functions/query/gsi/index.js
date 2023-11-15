export const FILTER_QUERY_DATES = Object.freeze({
    CHECK_IN_CHECK_OUT:"CHECK_IN_CHECK_OUT",
    CHECK_IN:"CHECK_IN",
    CHECK_OUT:"CHECK_OUT",
});

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

export const gsi_active_bookings_with_date_range = (dateRange,filter) =>{
    switch(filter){
        case FILTER_QUERY_DATES.CHECK_IN_CHECK_OUT: return allConfirmedBookingsWithCheckInDateAndCheckOutDate(dateRange.checkInDate,dateRange.checkOutDate);
        case FILTER_QUERY_DATES.CHECK_IN: return allConfirmedBookingsWithCheckInDate(dateRange.checkInDate);
        case FILTER_QUERY_DATES.CHECK_OUT: return allConfirmedBookingsWithCheckOutDate(dateRange.checkOutDate);
        default: return allConfirmedBookings();
    }
}

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
        KeyConditionExpression:"#pk = :pk AND #sk_1 BETWEEN :sk1 AND :sk2",
        ProjectionExpression: "id, checkInDate, checkOutDate, numberOfGuests,numberOfRooms,referencePerson.#n",
        FilterExpression:"#sk_2 <= :sk2",
        ExpressionAttributeNames: {"#pk":"GSI_PK_1","#sk_1":"GSI_SK_1","#sk_2":"checkOutDate","#n":"name"},
        ExpressionAttributeValues:{":pk": "BOOKING#CONFIRMED",":sk1":checkInDate,":sk2":checkOutDate},
        ScanIndexForward:false,
    };
}

const allConfirmedBookingsWithCheckInDate = (checkInDate) =>{
    return{
         TableName: process.env.DYNAMO_DB_TABLE,
         IndexName: process.env.GSI_GENERIC_PK_SK,
         KeyConditionExpression:"#pk = :pk AND #sk >= :sk",
         ProjectionExpression: "id, checkInDate, checkOutDate, numberOfGuests,numberOfRooms,referencePerson.#n",
         ExpressionAttributeNames: {"#pk":"GSI_PK_1","#sk":"GSI_SK_1","#n":"name"},
         ExpressionAttributeValues:{":pk": "BOOKING#CONFIRMED",":sk":checkInDate},
         ScanIndexForward:false,
     };
 }
 
 const allConfirmedBookingsWithCheckOutDate = (checkOutDate) =>{
    return{
         TableName: process.env.DYNAMO_DB_TABLE,
         IndexName: process.env.GSI_GENERIC_PK_SK,
         KeyConditionExpression:"#pk = :pk AND #sk_1 < :sk1",
         ProjectionExpression: "id, checkInDate, checkOutDate, numberOfGuests,numberOfRooms,referencePerson.#n",
         FilterExpression:"#sk_2 <= :sk1",
         ExpressionAttributeNames: {"#pk":"GSI_PK_1","#sk_1":"GSI_SK_1","#sk_2":"checkOutDate","#n":"name"},
         ExpressionAttributeValues:{":pk": "BOOKING#CONFIRMED",":sk1":checkOutDate},
         ScanIndexForward:false,
     };
 }



const addDays = function(str, days) {
    var myDate = new Date(str);
    myDate.setDate(myDate.getDate() + parseInt(days));
    return myDate;
}


//https://ge4aauq1nl.execute-api.eu-north-1.amazonaws.com/bookings/current?checkInDate=2023-12-01&checkOutDate=2023-12-29