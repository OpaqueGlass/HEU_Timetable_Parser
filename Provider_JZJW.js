/*
   此文件是HEU_Timetable_Parser的一部分，用于（2022）新教务系统导入，应配
   合Parser_JZJW、Timer_JZJW使用。
   This file is a part of OpaqueGlass/HEU_Timetable_Parser PROJECT,
   for importing cource information from new EAS (JZJW).
 */
async function scheduleHtmlProvider() {
    await loadTool('AIScheduleTools');
    let classInfos = new Array();
    try{
        await AIScheduleAlert({
            titleText: '提示', 
            contentText: `导入时将发送网络请求获取课表（而不使用当前网页获取）；如果课程较多，需要等待一段时间，大概少于1分钟；
            请您理解，由于课表多样、教务系统变化较快，此项目可能无法适配您的课表。
            本课表导入项目开源地址：https://github.com/OpaqueGlass/HEU_Timetable_Parser。`, 
            confirmText: '确认', 
        });
        //开发者测试用，否则默认请求当前学期课表
        // const termStr = await AISchedulePrompt({
        //     titleText: '输入学期', // 标题内容，字体比较大，超过10个字不给显示的喔，也可以不传就不显示
        //     tipText: '默认是根据当前时间生成的，应该可以直接点确认', // 提示信息，字体稍小，支持使用``达到换行效果，具体使用效果建议真机测试，也可以不传就不显示
        //     defaultText: getTerm(), // 文字输入框的默认内容，不传会显示版本号，所以空内容要传个''
        //     validator: value => { // 校验函数，如果结果不符预期就返回字符串，会显示在屏幕上，符合就返回false
        //       let matchRes = value.match(/^[0-9]+-[0-9]+-[12]$/gm);
        //       if (matchRes == null || matchRes.length != 1) return "@_@好像不太对";
        //       return false;
        // }});
        let termStr = getTerm();
        for (let i = 1, count = 0; i < 200; i++){
            let onePageInfo = await getOnePage(i, termStr);
            if (onePageInfo != null && onePageInfo != undefined && onePageInfo.rows != undefined){
                classInfos.push.apply(classInfos, onePageInfo.rows);
                count += onePageInfo.rows.length;
            }
            if (count >= onePageInfo.totalSize){
                break;
            }
        }
    }catch(err){
        console.error(err);
        await AIScheduleAlert({
            titleText: '获取课程时发生错误',
            contentText: "错误详情："+err,
            confirmText: '确认',
        });
        return "do not continue"
    }
    // console.log(classInfos);
    return JSON.stringify(classInfos);
  }

/**
 * 获取学期
 * @returns 当前学期字符串 yyyy-yyyy-t
 */
function getTerm(){
    let now = new Date();
    let month = now.getMonth();
    let year = now.getFullYear();
    let termString = "";
    console.log("当前时间", year, month);
    if (month >= 7){//8~12月，显示 当年-次年-1
        termString = `${year.toString()}-${(year + 1).toString()}-1`;
    }else if (month < 7 && month > 0){//2~7月，显示 去年-当年-2
        termString = `${(year - 1).toString()}-${(year).toString()}-2`;
    }else{//1月，显示 去年-当年-1
        termString = `${(year - 1).toString()}-${(year).toString()}-1`;
    }
    return termString;
}

/**
 * 请求一页课表内容
 * @param {*} pageNum 
 * @param {*} term 
 * @returns 
 */
async function getOnePage(pageNum, term){
    let response = await fetch('/jwapp/sys/wdkb/modules/xskcb/cxxszhxqkb.do',{
        "method": "POST",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        "body": `XNXQDM=${term}&pageSize=40&pageNumber=${pageNum}`
    });
    if (response.status == 403) {
        await AIScheduleAlert({
            titleText: '获取课程时发生错误',
            contentText: "错误详情：403 无权访问课表页面",
            confirmText: '确认',
        });
        return {"nodata": true, "totalSize": 0};
    }
    if (response.status < 200 || response.status >= 300) throw new Error("网络错误" + response.status);
    let result = await response.json();
    if (result == null || result == undefined || result.code != "0"){
        console.warn("未获取到课程信息", response);
        throw new Error(result);
        return null;
    }
    if (result.datas.cxxszhxqkb == undefined || result.datas.cxxszhxqkb.extParams.msg.indexOf("成功") == -1 ){
        console.warn("未获取到课程信息", response);
        throw new Error(result);
        return null;
    }
    return result.datas.cxxszhxqkb;
}