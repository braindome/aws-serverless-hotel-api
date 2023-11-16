import { SERVER } from "../../../aws_module";
import { gsi_available_room_by_size,gsi_available_room_without_size } from "../../query/gsi";
import { verifyDateParameters,getDateRangeBetween } from "../../query/helper";

const errMissingDates = "Parameters [ checkInDate=YYYY-MM-DD] or [ checkOutDate=YYYY-MM-DD ] is missing or contains invalid value."
const errDateRange = "Period exceeds max number of nights [7]"

exports.handler = async (event, context) => {
    try{
        const param = event.queryStringParameters;
        const req = verifyDateParameters(param);
        if(!req.gotParams && !req.verified){ return SERVER.sendResponse(400,{success:false,msg:errMissingDates});}

        const checkInDate = param.checkInDate;
        const checkOutDate = param.checkOutDate;

        const dateRangeList = getDateRangeBetween(checkInDate,checkOutDate);
        if(dateRangeList.length > 7){ return SERVER.sendResponse(400,{success:false,msg:errDateRange} )}

        if("roomSize" in param && 0 < parseInt(param.roomSize) && parseInt(param.roomSize) <= 3){
            const {Items} = await SERVER.documentClient.query(gsi_available_room_by_size(dateRangeList,param.roomSize)).promise();
            return SERVER.sendResponse(200,{success:true,rooms:Items});
        }
       
        const {Items} = await SERVER.documentClient.query(gsi_available_room_without_size(dateRangeList)).promise();
        return SERVER.sendResponse(200,{success:true,rooms:Items});
    }
    catch(err){
        return SERVER.sendResponse(500,{success:false,msg:err});
    }
}