import { SERVER } from "../../../aws_module";
import { gsi_active_bookings,gsi_active_bookings_with_date_range,FILTER_QUERY_DATES } from "../../query/gsi";

exports.handler = async (event, context) => {
    try{
        const param = event.queryStringParameters;
        const req = verifyParameters(param);
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


const verifyParameters = (param) =>{
    if(param === null || param === undefined || isObjectEmpty(param)){ return {gotParams:false}; }
    if("checkInDate" in param && "checkOutDate" in param){return {gotParams:true,verified:true,filter:FILTER_QUERY_DATES.CHECK_IN_CHECK_OUT};}
    if("checkInDate" in param){return {gotParams:true,verified:true,filter:FILTER_QUERY_DATES.CHECK_IN};}
    if("checkOutDate" in param){return {gotParams:true,verified:true,filter:FILTER_QUERY_DATES.CHECK_OUT};}
    return {gotParams:true,verified:false};
}

const isObjectEmpty = (obj) => {
    return (
      obj &&
      Object.keys(obj).length === 0 &&
      obj.constructor === Object
    );
  };