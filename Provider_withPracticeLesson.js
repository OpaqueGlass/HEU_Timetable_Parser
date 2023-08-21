async function scheduleHtmlProvider(iframeContent = "", frameContent = "", dom = document) {
    /**
     * @name 理论课表和实践课表HTML获取
     * @description 
     * @version 0.4.0
     */
    await loadTool('AIScheduleTools');
    //获取标题
    let check;
    try{
        check = dom.getElementsByTagName("title");
        check = check[0].innerText;
    }catch(error){
        await AIScheduleAlert("出现错误","请确认当前页面显示了课表。" + error);
        console.error(error);
        return "do not continue";
    }

    //根据标题判定课表
    if (check == "查看课表"){
        //工程时间课表

        //课表网页内容
        let practiceTableElem = dom.getElementById("Form1");
        let practiceTable = "";
        if (practiceTableElem){
            practiceTable = practiceTableElem.innerHTML;
        }else{
            await AIScheduleAlert({
                titleText: '错误', 
                contentText: "在当前页面找不到工程实践课表", 
                confirmText: '我知道了',
            });
            return "do not continue";
        }
        await AISchedulePrompt({
            titleText: '步骤1/5 全选复制', // 标题内容，字体比较大，超过10个字不给显示的喔，也可以不传就不显示
            tipText: `点击输入框之后，在空格处长按，全选复制；【不要修改其中的内容】
            如果您打不开复制菜单，可尝试使用输入法的全选复制功能（图标大概长这样“<I>”）。
            提示：全选，不要自己拖拽选择，内容很长。`, 
            defaultText: practiceTable,
            validator: value => { 
              return false;
        }});
        //创建提示词
        document.body.innerHTML = `
        <div id="opaqueglass">
        <p id="info">如果刚才没有复制，在下面还能再次复制哦。（请务必全选）</p>
        <textarea readonly>${practiceTable}</textarea>
        <p id="warn">点击下方的链接后，请在显示了理论课表的情况下，再点击“一键导入”</p>
        <p id='links'><a id="linkA"></a></p>
        <br/><br/>
        <p><a id="linkB"></a></p>
        </div>
        `;
        // 统一设置字号
        let idArray = ["warn", "linkA","info", "linkB"];
        for (let id of idArray){
            document.getElementById(id).style.fontSize = "16px";
        }
        
        let link = document.getElementById("linkA");
        link.innerText = "步骤2/5【点击这里前往金智教务继续导入】";
        link.setAttribute("href", "http://jwgl.hrbeu.edu.cn/jwapp/sys/wdkb/*default/index.do?EMAP_LANG=zh#/xskcb");
        // link.setAttribute("target", "_blank");
        let linkB = document.getElementById("linkB");
        linkB.innerText = "如果上面的无法打开，请【点击我】";
        linkB.setAttribute("href", "http://jwgl.hrbeu.edu.cn/");
        return "do not continue";
    }else if (check != "课表查询"){
        //在金智教务页面
        const practiceTable = await AISchedulePrompt({
            titleText: '步骤4/5 粘贴',
            tipText: '在这里粘贴刚才复制的内容（工程实践课表内容），请确保不重复粘贴。如果您没有复制，请先退出，下次打开工程实践课表后点导入。', 
            defaultText: '',
            validator: value => { // 校验函数，如果结果不符预期就返回字符串，会显示在屏幕上，符合就返回false
              return false;
          }});

        const userInput = await AISchedulePrompt({
            titleText: '步骤5/5 顺延补偿', // 标题内容，字体比较大，超过10个字不给显示的喔，也可以不传就不显示
            tipText: '【课程没有顺延直接点确认，不要动默认值】\n如果工程实践课程顺延，请在输入框输入“原上课周次-更改后上课周次”。\n例如：第5周课程推迟到第7周（之后课程顺延，1-4周课程不导入），则输入“5-7”。',
            defaultText: '1-1', 
            validator: value => { // 校验函数，如果结果不符预期就返回字符串，会显示在屏幕上，符合就返回false
                //正则匹配用户输入，应当为数字-数字格式，value为用户输入值
                let reg = "^[0-9]+-[0-9]+$";
                let matchres = value.match(reg);
                if (matchres == null || matchres.length != 1) return "格式不对哦⊙︿⊙"; 
                matchres = matchres[0].split('-');
                console.log("HI:拆分后的获得信息",matchres);
                if (matchres[0] <= 0 || matchres[1] <= 0) return "没有第0周哦^_^";
                return false;
        }});
        // 获取理论课表内容
        let classInfos = new Array();
        try{
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
                titleText: '获取理论课表时发生错误',
                contentText: "错误详情："+err,
                confirmText: '确认',
            });
            return "do not continue"
        }
        return "<div id=\"practiceDelay\">" + userInput + "</div>*#*##*#*" + JSON.stringify(classInfos) + "*#*##*#*" + practiceTable;
    }else{
        await AIScheduleAlert({
            titleText: '课表页面不太对',
            contentText: "请先打开工程实践课表，如果只导入理论课表，请使用“金智教务”导入项目。",
            confirmText: '确认',
        });
        return "do not continue";
    }
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

/**
 * 请求一页课表内容
 * @param {*} pageNum 
 * @param {*} term 
 * @returns 
 */
 async function getOnePage(pageNum, term){
    let response = await fetch('http://jwgl.hrbeu.edu.cn/jwapp/sys/wdkb/modules/xskcb/cxxszhxqkb.do',{
        "method": "POST",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        "body": `XNXQDM=${term}&pageSize=40&pageNumber=${pageNum}`,
        "mode": "no-cors",
        "credentials": "include"
    });
    if (response.status < 200 || response.status >= 300) throw new Error("网络错误" + response.status);
    let result = await response.json();
    if (result == null || result == undefined || result.code != "0"){
        console.warn("未获取到课程信息", response);
        throw new Error("未获取到课程信息", response);
    }
    if (result.datas.cxxszhxqkb == undefined || result.datas.cxxszhxqkb.extParams.msg.indexOf("成功") == -1 ){
        console.warn("未获取到课程信息", response);
        throw new Error("未获取到课程信息", response);
    }
    return result.datas.cxxszhxqkb;
}