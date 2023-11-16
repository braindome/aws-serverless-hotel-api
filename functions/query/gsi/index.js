
export const FILTER_QUERY_DATES = Object.freeze({
    CHECK_IN_CHECK_OUT:"CHECK_IN_CHECK_OUT",
    CHECK_IN:"CHECK_IN",
    CHECK_OUT:"CHECK_OUT",
});

export const gsi_available_room_by_size = (dateRangeList,roomSize) =>{
    const q = filterExpressionAndExpressionAttribute(dateRangeList);
    q.expressionAttribute[":pk"] = "ROOM";
    q.expressionAttribute[":sk"] = `${roomSize}`;
    return{
        TableName: process.env.DYNAMO_DB_TABLE,
        IndexName: process.env.GSI_GENERIC_PK_SK,
        KeyConditionExpression:"#pk = :pk AND #sk = :sk",
        ProjectionExpression: "id, roomNumber, roomPrice, roomSize",
        FilterExpression:q.filterExpression,
        ExpressionAttributeNames: {"#pk":"GSI_PK_1","#sk":"GSI_SK_1"},
        ExpressionAttributeValues:q.expressionAttribute,
        ScanIndexForward:false,
    };
}

export const gsi_available_room_without_size = (dateRangeList) =>{
    const q = filterExpressionAndExpressionAttribute(dateRangeList);
    q.expressionAttribute[":pk"] = "ROOM";
    return{
        TableName: process.env.DYNAMO_DB_TABLE,
        IndexName: process.env.GSI_GENERIC_PK_SK,
        KeyConditionExpression:"#pk = :pk",
        ProjectionExpression: "id, roomNumber, roomPrice, roomSize",
        FilterExpression:q.filterExpression,
        ExpressionAttributeNames: {"#pk":"GSI_PK_1"},
        ExpressionAttributeValues:q.expressionAttribute,
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

const filterExpressionAndExpressionAttribute  = (dateRangeList) =>{
    var filterExpression = ""
    var expressionAttribute = {}
    dateRangeList.forEach((date,i) =>{
        if(i === 0){ filterExpression += `not contains (bookedDates, :d${i})` }
        else{ filterExpression += `AND not contains (bookedDates, :d${i})` }
        expressionAttribute[`:d${i}`] = date;
        if(i >= 7){throw new Error('Number of dates exceed hotel policy!'); }
    })

    return {filterExpression:filterExpression,expressionAttribute:expressionAttribute}
}

//https://ge4aauq1nl.execute-api.eu-north-1.amazonaws.com/bookings/current?checkInDate=2023-12-01&checkOutDate=2023-12-29