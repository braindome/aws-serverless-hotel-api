import { SERVER } from "../../../aws_module";
import { gsi_available_room_by_size,gsi_available_room_without_size } from "../../query/gsi";
import { verifyDateParameters } from "../../query/helper";

const errMissingDates = "Parameters [ checkInDate=YYYY-MM-DD] or [ checkOutDate=YYYY-MM-DD ] is missing or contains invalid value."

exports.handler = async (event, context) => {
    try{
        const param = event.queryStringParameters;
        const req = verifyDateParameters(param);
        if(!req.gotParams && !req.verified){ return SERVER.sendResponse(400,{success:false,msg:errMissingDates});}

        const checkInDate = param.checkInDate;
        const checkOutDate = param.checkOutDate;
        if("roomSize" in param && 0 < parseInt(param.roomSize) && parseInt(param.roomSize) <= 3){
            const {Items} = await SERVER.documentClient.query(gsi_available_room_by_size(checkInDate,checkOutDate,param.roomSize)).promise();
            return SERVER.sendResponse(200,{success:true,rooms:Items});
        }
       
        const {Items} = await SERVER.documentClient.query(gsi_available_room_without_size(checkInDate,checkOutDate)).promise();
        return SERVER.sendResponse(200,{success:true,rooms:Items});
    }
    catch(err){
        return SERVER.sendResponse(500,{success:false,msg:err});
    }
}