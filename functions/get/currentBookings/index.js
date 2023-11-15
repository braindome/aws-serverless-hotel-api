import { SERVER } from "../../../aws_module";
import { gsi_active_bookings,gsi_active_bookings_with_date_range } from "../../query/gsi";
import {verifyDateParameters} from "../../query/helper/index"

exports.handler = async (event, context) => {
    try{
        const param = event.queryStringParameters;
        const req = verifyDateParameters(param);
        if(!req.gotParams){
            const {Items} = await SERVER.documentClient.query(gsi_active_bookings()).promise();
            return SERVER.sendResponse(200,{success:true,rooms:Items});
        }
        if(req.gotParams && req.verified){
            const {Items} = await SERVER.documentClient.query(gsi_active_bookings_with_date_range(param,req.filter)).promise();
            return SERVER.sendResponse(200,{success:true,rooms:Items});
        }
        return SERVER.sendResponse(400,{success:false,msg:"Parameters [ checkInDate=YYYY-MM-DD] or [ checkOutDate=YYYY-MM-DD ] is missing or contains invalid value."});
        
    }
    catch(err){
        return SERVER.sendResponse(500,{success:false,msg:err});
    }
}
