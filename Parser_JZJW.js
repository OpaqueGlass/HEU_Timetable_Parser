/*
   此文件是HEU_Timetable_Parser的一部分，用于（2022）新教务系统导入，应配
   合Provider_JZJW、Timer_JZJW使用。
   This file is a part of  OpaqueGlass/HEU_Timetable_Parser PROJECT,
   for importing cource information from new EAS (JZJW).
 */
/**
 * 
 * @param {String} html Provider_JZJW/scheduleHtmlProvider的返回值
 * @returns 
 */
function scheduleHtmlParser(html) {
    let result = new Array();
    try{
        let rawClassInfos = JSON.parse(html);
        if (rawClassInfos == null || rawClassInfos == undefined || rawClassInfos.length == 0){
            throw new Error("未获取到课程信息");
        }
        rawClassInfos.forEach(function(current){
            let temp = {
                name: current.KCM, // 课程名称
                position: getPosition(current), // 上课地点
                teacher: getTeacher(current), // 教师名称
                weeks: getWeeks(current), // 周数
                day: current.SKXQ, // 星期
                sections: getSections(current), // 节次
            }
            result.push(temp);
    });
    }catch(err){
        console.error(err);
        let bugReport = [{
            name: "抱歉，处理课程时出现错误>_<",
            position: "请尝试使用其他导入项目(ToT)/~~~ ",
            teacher: "og",
            weeks: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
            day: 1,
            sections: [1,2,3,4,5],
        },
        {
            name: "错误详情" + err.name,
            position: err.message + " ",
            teacher: err.stack.substring(err.stack.indexOf("at")) + " ",
            weeks: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
            day: 2,
            sections: [1,2,3,4,5],
        }];
        return bugReport;
    }
    
    return result
}

function getWeeks(info){
    let data = info.ZCMC;
    let result = new Array();
    let splitdata = data.split(",");
    splitdata.forEach((current)=>{
        let weekNums = current.match(/[0-9]+/gm);
        switch (weekNums.length){
            case 1: result.push(parseInt(weekNums[0]));break;
            case 2: {
                if (current.indexOf("单") >=0 || current.indexOf("双") >= 0){
                    for (let i = parseInt(weekNums[0]); i <= parseInt(weekNums[1]); i+=2) result.push(i);
                }else{
                    for (let i = parseInt(weekNums[0]); i <= parseInt(weekNums[1]); i++) result.push(i);
                }
                break;
            }
            default: {
                console.error("error未识别的课程周数情况", info.ZCMC);
                throw new Error("不能识别周数"+info.ZCMC);
                break;
            }
        }
    });
    return result;
}

function getSections(info){
    let result = new Array();
    for (let i = info.KSJC; i <= info.JSJC; i++) result.push(i);
    return result;
}

function getDay(info){

}

function getTeacher(info){
    let data = info.SKJS;
    if (!isValidStr(data)) return "未知";
    return data;
}

function getPosition(info){
    let data = info.JASMC;
    if (!isValidStr(data)) return "未知";
    return data;
}

function isValidStr(data){
    if (data == undefined || data == null || data == "") return false;
    return true;
}