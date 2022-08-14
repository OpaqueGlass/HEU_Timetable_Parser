async function scheduleHtmlProvider(iframeContent = "", frameContent = "", dom = document) {
    /**
     * @name 理论课表HTML获取
     * @description 格式规范化&衍生自合并获取getBoth
     * @version 0.3.0
     */
    await loadTool('AIScheduleTools');
    //要获取表格的html结构，还是要多往上找一级
    let check
    try{
        check = dom.getElementsByTagName("title");
        check = check[0].innerText;
    }catch(error){
        await AIScheduleAlert("出现错误","请确认当前页面显示了课表，如仍有错误，请联系开发者QQ1354457997。" + error);
        console.error(error);
        return "do not continue";
    }
    let result; 
    //工程实践课表，则获取两个课表
    if (check == "查看课表"){
        //获取用户课程推迟要求
        const userInput = await AISchedulePrompt({
            titleText: '工程实践顺延补偿', // 标题内容，字体比较大，超过10个字不给显示的喔，也可以不传就不显示
            tipText: '【课程没有顺延直接点确认，不要动默认值】\n如果工程实践课程顺延，请在输入框输入“原上课周次-更改后上课周次”。\n例如：第5周课程推迟到第7周（之后课程顺延，1-4周课程不导入），则输入“5-7”。', // 提示信息，字体稍小，支持使用``达到换行效果，具体使用效果建议真机测试，也可以不传就不显示
            defaultText: '1-1', // 文字输入框的默认内容，不传会显示版本号，所以空内容要传个''
            validator: value => { // 校验函数，如果结果不符预期就返回字符串，会显示在屏幕上，符合就返回false
              //正则匹配用户输入，应当为数字-数字格式，value为用户输入值
              let reg = "^[0-9]+-[0-9]+$";
              let matchres = value.match(reg);
              if (matchres == null || matchres.length != 1) return "格式不对哦⊙︿⊙"; 
              matchres = matchres[0].split('-');
              console.log("HI:拆分后的获得信息");
              console.log(matchres);
              if (matchres[0] <= 0 || matchres[1] <= 0) return "没有第0周哦^_^";
              return false;
          }});
        
        let practiceTable = dom.getElementById("Form1").innerHTML;
        //获取理论课表
        let theroyTable;
        let getTheroy = false;
        let netWorkError;
        /**获取现在时间，推断id */
        await fetch('/jsxsd/xskb/xskb_list.do?Ves632DSdyV=NEW_XSD_PYGL',{
            "method": "POST",
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            "body": `xnxq01id=${getTerm()}`
        }).then(async (response) => {
            getTheroy = true;
            const text = await response.text();
            theroyTable = text;
        }).catch(err => {
            getTheroy = false;
            netWorkError = err;
            console.error(err);
        });
        //请求失败，原方案重试
        if (!getTheroy){
            await fetch('/jsxsd/xskb/xskb_list.do?Ves632DSdyV=NEW_XSD_PYGL',
            ).then(async (response) => {
                getTheroy = true;
                const text = await response.text();
                theroyTable = text;
            }).catch(err => {
                getTheroy = false;
                netWorkError = err;
                console.error(err);
            });
        }
        if (getTheroy == false || theroyTable == undefined || theroyTable == ""){
            await AIScheduleAlert({
                titleText: '网络错误', // 标题内容，字体比较大，不传默认为提示
                contentText: '无法访问理论课表页面或访问超时: ' + netWorkError.message, // 提示信息，字体稍小，支持使用``达到换行效果，具体使用效果建议真机测试
                confirmText: '我知道了', // 确认按钮文字，可不传默认为确认
            });
            return "do not continue";
        }
        const userConfrim = await AIScheduleConfirm({
            titleText: '\u26a0\u203c\u1f52c实验性功能', // 标题内容，字体比较大，超过10个字不给显示的喔，也可以不传就不显示
            contentText: '要启用冲突课程处理功能吗？(⊙o⊙)？\n启用后，无法导入的冲突课程将被合并导入，课程信息之间用竖线|分隔。【务必仔细检查导入结果】', // 提示信息，字体稍小，支持使用``达到换行效果，具体使用效果建议真机测试，为必传，不传显示版本号
            cancelText: '禁用', // 取消按钮文字，可不传默认为取消
            confirmText: '启用', // 确认按钮文字，可不传默认为确认
        });

        result = `<div id="practiceDelay">${userInput}</div><div id="conflictHandler">${userConfrim.toString()}</div>`+"*#*##*#*" + theroyTable + "*#*##*#*" + practiceTable;
    }else if (check == "学期理论课表"){
        console.log("认定为学期理论课表");
        const userConfrim = await AIScheduleConfirm({
            titleText: '\u26a0\u203c\u1f52c实验性功能', // 标题内容，字体比较大，超过10个字不给显示的喔，也可以不传就不显示
            contentText: '要启用冲突课程处理功能吗？(⊙o⊙)？\n启用后，无法导入的冲突课程将被合并导入，课程信息之间用竖线|分隔。【务必仔细检查导入结果】', // 提示信息，字体稍小，支持使用``达到换行效果，具体使用效果建议真机测试，为必传，不传显示版本号
            cancelText: '禁用', // 取消按钮文字，可不传默认为取消
            confirmText: '启用', // 确认按钮文字，可不传默认为确认
        });
        
        const ifrs = dom.getElementById("Form1");
        return "<div id=\"conflictHandler\">"+userConfrim.toString()+"</div>"+ " *#*##*#*"  + ifrs.innerHTML;
    }else{
        await AIScheduleAlert({
            titleText: '未打开课表', // 标题内容，字体比较大，不传默认为提示
            contentText: '不在“学期理论课表”或“工程实践课表页面”。如果显示了课表，学校教务估计已经升级，请重新申请适配。\n本课表导入项目开源地址：https://github.com/OpaqueGlass/HEU_Timetable_Parser/', // 提示信息，字体稍小，支持使用``达到换行效果，具体使用效果建议真机测试
            confirmText: '我知道了', // 确认按钮文字，可不传默认为确认
        });
        return "do not continue";
    }
    return result;
}


/**
 * 
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