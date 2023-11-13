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

