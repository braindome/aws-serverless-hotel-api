import { FILTER_QUERY_DATES } from "../gsi";

export const verifyDateParameters = (param) =>{
    if(param === null || param === undefined || isObjectEmpty(param)){ return {gotParams:false}; }
    if("checkInDate" in param && "checkOutDate" in param){return {gotParams:true,verified:true,filter:FILTER_QUERY_DATES.CHECK_IN_CHECK_OUT};}
    if("checkInDate" in param){return {gotParams:true,verified:true,filter:FILTER_QUERY_DATES.CHECK_IN};}
    if("checkOutDate" in param){return {gotParams:true,verified:true,filter:FILTER_QUERY_DATES.CHECK_OUT};}
    return {gotParams:true,verified:false};
}

export const isObjectEmpty = (obj) => {
    return (
      obj &&
      Object.keys(obj).length === 0 &&
      obj.constructor === Object
    );
};

export const getDateRangeBetween = (from,to) =>{
    for(var dates = [],dt = new Date(from);dt<=new Date(to);dt.setDate(dt.getDate()+1)){
        dates.push(new Date(dt).toISOString());
    }
    return dates;
}

export const addDays = function(str, days) {
    var myDate = new Date(str);
    myDate.setDate(myDate.getDate() + parseInt(days));
    return myDate;
}

export const oneYearAhead = () => {
    var myDate = new Date();
    myDate.setDate(myDate.getDate() + 365);
    return myDate;
}