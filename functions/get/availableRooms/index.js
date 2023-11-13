import { SERVER } from "../../../aws_module";
import { gsi_room_by_size } from "../../query/gsi";
exports.handler = async (event, context) => {
    try{
        //https://ge4aauq1nl.execute-api.eu-north-1.amazonaws.com/rooms?roomSize=2
        let roomSize = 0;
        const param = event.queryStringParameters;
        if("roomSize" in param){ roomSize = parseInt(param.roomSize) }
        if(0 < roomSize && roomSize <= 3){
            const {Items} = await SERVER.documentClient.query(gsi_room_by_size(roomSize)).promise();
            return SERVER.sendResponse(200,{success:true,rooms:Items});
        }
        return SERVER.sendResponse(400,{success:false,msg:"Required parameter [ roomSize ] missing or contains invalid value. (Valid range 1-3)"});
    }
    catch(err){
        return SERVER.sendResponse(500,{success:false,msg:err,requirements:"Parameter [ roomSize ] possible missing or contains invalid value. (Valid range 1-3)"});
    }
}