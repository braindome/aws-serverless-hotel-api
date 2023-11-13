export const gsi_date_occupied = (checkIn,checkOut) =>{
    // DO SOME MAGIC
    return{};
    /*return{
        TableName: "process.env.DYNAMO_DB_TABLE",
        IndexName: "process.env.GSI_ROOM_AVAILABLE_DATE_RANGE",
        KeyConditionExpression:"#pk = :pk AND #sk = :sk",
        ExpressionAttributeNames: {"#pk":"checkIn","#sk":"checkOut"},
        ExpressionAttributeValues:{":pk": checkIn,":sk": checkOut},
        ScanIndexForward:false,
    };*/
}

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

