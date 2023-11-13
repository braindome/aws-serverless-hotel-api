import { SERVER } from "../../../aws_module";
import { gsi_date_occupied } from "../../query/gsi";
exports.handler = async (event, context) => {
    try{
        //const param = event.queryStringParameters;
        //const param = event.pathParameters.price;
        //const body = JSON.parse(event.body);
        //https://stackoverflow.com/questions/53936773/what-are-event-and-context-in-function-call-in-aws-lambda
        //if checkin is less the today return ERROR
        // const from = 2023-11-14
        //const to = 2023-11-21
        //const {Items} = await SERVER.documentClient.query(gsi_date_occupied(from,to)).promise();
        //return SERVER.sendResponse(200,{success:true,rooms:Items});
        return SERVER.sendResponse(200,{success:true,rooms:[]});
    }
    catch(err){
        return SERVER.sendResponse(500,{success:false,msg:err});
    }
}