function scheduleHtmlParser(html){
    /**
     * @name HEU Theoretics and Practice Lessons Parser
     * @version 0.2.6(2022-2-28)
     * @author OpaqueGlass
     * @contact https://github.com/OpaqueGlass/HEU_Timetable_Parser/
     */

    let errorReport = [{
        name: "抱歉，处理课程信息失败(。﹏。*)",
        position: "",
        teacher: "如果可以，请将错误信息发送给开发者",
        weeks: [1,2,3,4,5],
        day: 1,
        sections: [1,2,3,4,5]
    },{
        name: "BUG反馈给",
        position: "1354457997@",
        teacher: "qq.com。",
        weeks: [1,2,3,4,5],
        day: 2,
        sections: [1,2,3,4,5]
    }];
    try{
    /*检测并处理工程时间课程顺延请求 */
    let div = $('tr').toArray();//将列表行listrow转为数组形式储存
    let userChoice = $('#practiceDelay').text();
    console.info("获取到课程顺延请求");
    console.log(userChoice);
    let reg = "^[0-9]+-[0-9]+$";//正则，用于获取第一个正确格式输入
    let matchres = userChoice.match(reg);//正则匹配结果
    if (matchres != null && matchres.length != 0){
        matchres = matchres[0].split('-');//获得数组，下标0：原开始周次，1推迟后周次
        console.log("用户的推迟请求：");
        console.log(matchres);
        // if (matchres[0] > matchres[1]){
        //     matchres[0] = 1;
        //     matchres[1] = 1;
        // }
    }
   
    /*确定是否进行冲突课程处理 */
    let userConflictConfirm = $('#conflictHandler').text();
    console.log(userConflictConfirm);
    if (userConflictConfirm == "true"){
        userConflictConfirm = true;
    }else{
        userConflictConfirm = false;
    }
    /*判断是否包含工程实践课程*/
    let fin;
    if (div.length <= 10){
        console.info("认定无工程实践课信息，仅导入学期理论课表");
        fin = theoreticsScheduleHtmlParser(html, false);
    }else{
        console.info("认定有工程实践课信息，工程实践课将被详细课程方案替换");
        let InfosA = theoreticsScheduleHtmlParser(html, true);
        let InfosB = practiceScheduleHtmlParser(html, matchres);
        fin = InfosA.concat(InfosB);
    }
    
    console.log("合并课程数组结果");
    console.log(fin);
    if (userConflictConfirm){
        return mergeConflictCourse(fin);
    }else{
        return fin;
    }
    
    }catch(err){
        console.error(err);
        errorReport[0].position = err.message;
        return errorReport;
    }
    
}
function theoreticsScheduleHtmlParser(html, havePra) {
    /**
     * @name HEU Theory Lessons Parser
     * @version 0.4.3(220212)-Pra  此版本在原有版本上进行了havePra更改，用于判断是否需要删去“工程实践”
     * @warn 后续修改注意：此函数调用getWeeks()获取周数信息，而不是getWeek()
     * @log 更新：按照列优先导入课程
     * @author OpaqueGlass
     * @contact https://github.com/OpaqueGlass/HEU_Timetable_Parser/
     */
    const $ = cheerio.load(html);//该代码用于使用cheerio，并导入html
    var row_Count = 0;//为获取表格行id，使用的循环标记
    var first = $('#kbtable input');//获取kbtable 下input元素，
    var first_length = first.attr("value").length;//表格行id特征字段长
    let table_row = 
    ["5180478CC0C746CC94534AF06163E809-",
    "2B924210E3384CBE9A571BB503BB1E22-",
    "25BA0015D76143439BD0271B2178E1A2-",
    "0C53A76700E5489D95958B991966C069-",
    "FC68CEFDF4F4426FA780FFE0C12409ED-"]//课程表表格的行对应的id（特征部分），按大节拆分，0对应第一大节
    //开始获取id
    while(row_Count <= 4){
        //获取特征id（位于属性value中），并截取掉变化的部分
        table_row[row_Count] = first.attr("value").substring(0, first_length-3);
        //table_row[row_Count] = table_row[row_Count].substring(0, first_length-3);//赘余行
        console.log(table_row[row_Count]);
        row_Count++;
        //请尝试替换aaa，考虑使用
        first = first.parent().parent().next().children().next().children();//转移到下一个first元素
    }
    //获取id结束
    console.log("获取id结束");
    /*  变量声明 */
    let allInfo = [];//最后的信息交到这里
    let moreSections = [[0], [1, 2], [3, 4, 5], [6, 7], [8, 9, 10], [11, 12, 13]];//大节所包含的小节
        //调试时设定的初始值
    var row = 4;//大节号
    var column = 2;//星期x/
    /* 变量声明结束 */
    //这里开始循环
    for (column = 1;column <= 7;column++){
        for (row = 1;row <= 5;row++){
        //读取当日、该节时段的全部课程
        console.group("("+row+","+column+")");
        console.info("第"+row+"大节，星期"+column);
        console.info("大节基本信息");
        //获取本行id，-2为详细的课程信息
        var relaventID = table_row[row-1] + column + '-2';//详

        //获取本日本节中全部的课程源数据
        let newRawData = $('#' + relaventID ).toArray()[0];


        newRawData = newRawData.children;//尝试缩减代码
        let lengthRD = newRawData.length;
        console.log("详细课程信息数组");
        console.log(newRawData);
        
        //判定跳出（无课程）
        if (lengthRD == 1){
            console.groupEnd();
            if (column == 7) console.groupEnd();
            continue;
        }//如果无课程，跳过
        //空白课程对象，注意，星期，节次已经设定了值
        let nullInfo = {
            name: "未知",
            position: "未知",
            teacher: "未知",
            weeks: [0],
            day: column,
            sections: [0],
            C01: 0,//配合查重的新增项，用于记录本课程冲突类型C01（对应的冲突次数）
            C02: 0,
            C11: 0,
            C21: 0,
            C31: 0
        }
        let collecting = Object.assign({}, nullInfo);//新找到的内容填在这里
        for (k in newRawData){
            
            // console.log("此行信息", newRawData[k]);
            // console.log("类型",newRawData[k].type);
            if (newRawData[k].type == "text" && newRawData[k].data.indexOf("-----------") == -1){
                collecting.name = newRawData[k].data;
                console.group(row + "大节内课程");
                console.log("获取到课程名", collecting.name);
            }
            if (newRawData[k].type == "tag" && newRawData[k].name =="font"){
                console.log(newRawData[k].attribs.title);
                switch (newRawData[k].attribs.title){
                    case "老师":
                    case "教师": 
                        if (newRawData[k].children == undefined)break;
                        collecting.teacher = newRawData[k].children[0].data;
                        console.log("获得教师信息：", collecting.teacher);
                        break;
                    case "周次":
                        if (newRawData[k].children == undefined)break;
                        collecting.weeks = getWeeks(newRawData[k].children[0].data);
                        console.log("获得周次信息：", collecting.weeks);
                        break;
                    case "教室":
                    case "地点":
                        if (newRawData[k].children == undefined)break;
                        collecting.position = newRawData[k].children[0].data;
                        break;
                    case "节次":
                        if (newRawData[k].children == undefined)break;
                        collecting.sections = getSections(newRawData[k].children[0].data);
                        console.log("获取到节次：", collecting.sections);
                        if (collecting.sections.length == 1){
                            console.log("课程数只有一个小节，认为需要课程扩展为整个大节");
                            collecting.sections = moreSections[row];
                            collecting.name = collecting.name;//标注Ex，这个东西可能只能提前标注
                        }
                        break;
                }
            }
            if (k == newRawData.length - 1 || (newRawData[k].type == "text" && newRawData[k].data.indexOf("-----------") != -1)){
                //提交课程信息，另外，循环完了也要提交
                if (collecting.name.indexOf("工程实践") != -1 && havePra){
                    collecting = Object.assign({}, nullInfo);
                    console.groupEnd();
                    continue;//若有工程实践，本课程移除，不加入
                }
                console.log("提交本次内容，创建新的结构，读取下一组课程信息", collecting);
                allInfo.push(collecting);
                collecting = Object.assign({}, nullInfo);
                console.groupEnd();
            }
            //console.log();
        }
        console.groupEnd();
        }//终止行内每列循环
   } //这里终止行循环
   
   //console.log(singleInfo);
   console.log("Submit and return(END)(Allinfo showing below)");
   console.log(allInfo);
   
   return allInfo;
}


function getWeeks(data) {
    var i = 0;
    var count = 0;
    var begin = 0,
        end = 0;
    var result = new Array();
    data = data.replace("(周)", "");
    /* 单双周处理测试 */
    var singleWeek = 0;//0：正常 1：单周 2：双周
    //单双周课程处理，支持处理1-5(单周)等
    if (data.indexOf("单周") != -1){
        singleWeek = 1;
        data = data.replace("(单周)", "");
        console.log("是单周");
    }else if (data.indexOf("双周") != -1){
        singleWeek = 2;
        data = data.replace("(双周)", "");
        console.log("是双周");
    }
    var several = data.split(',');
    i = 0;
    console.log("拆分,后", several);
    while (i < several.length) {
        if (several[i].indexOf('-') == -1) {
            result[count] = parseInt(several[i]);
            count++;
        } else {
            begin = parseInt(several[i].substring(0, several[i].indexOf('-')));
            end = parseInt(several[i].substring(several[i].indexOf('-') + 1, several[i].length));

            while (begin <= end) {
                
                switch (singleWeek){
                    case 0: 
                        result[count] = begin;
                        count++;
                        break;
                    
                    case 1: 
                        if (begin % 2 != 0){
                            result[count] = begin;
                            count++;
                        }
                        break;
                    case 2:
                        if (begin % 2 == 0){
                            result[count] = begin;
                            count++;
                        }
                }
                begin++;
            }
        }
        i++;
    }
    return result;
}

function getSections(data) {
    /**
     * @version 0.2
     * @name 理论课表获取节数信息
     * @detail
     * 本次更新换用了新的section结构，不再使用含有时间的json，采用数组。
     */
    console.log(data);
    var i = 1;
    var count = 0;
    var j = 0;
    var result = new Array();
    count = 0;
    while (data[i] != '节') {
        result[count] = parseInt(data.substring(i, i + 2));
        count++;
        i += 2;
        if (i >= 20) {
            return -1; //一直循环说明判断错了，返回修正
        }
    }
    console.log("课程内节数测试" + result.length);
    if (result.length == 1 && result[0] == 1) { //检查全天课程特征项
        console.log("该课程仅一节");
        //return -2;
    }
    
    return result;
}
function practiceScheduleHtmlParser(html,matchres) {
    /**
     * @name 工程实践课表分析
     * @version 0.2.2(220212)-Merge
     */
    /*工程实践课程推迟（获取推迟参数） */
    matchres[1] = matchres[1] - matchres[0];//获取延迟周数
    matchres[0] = matchres[0] -1;//更改为增量，标记从第(1+matchres[0])周开始导入

    let allClassInfo_fin = new Array();//最后提交到此
    let div = $('tr').toArray();//将列表行listrow转为数组形式储存
    let name = "";//预先分配变量名
    let rawWeek = "";
    let ripeWeeks = new Array();
    let position = "";
    let teacher = "";
    let day = 0;
    let nextposition = "";
    let singleInfo;//存储每个单个提交
    console.log(div);
    let i = 2;
    let submit = false;
    for (i = 10 + matchres[0];i < div.length; i++){
        /**在使用v0.2版混合HTML获取时，将理论课表和实践课表进行了强制合并，请注意 理论课表含8个<tr>
         * 因此，请从i = 10开始，以排除无效的理论课表行（列标题行1+五大节课5+备注行1+实践课表个人信息行1+实践课表列标题行1）
         * 
         * 本循环一并将连续的课程合并输出
         */
        //加入周数、课程名缺失检验防范崩溃
        if (div[i].children[3].children.length == 0 || div[i].children[9].children.length == 0){
            console.error("课程信息不完整，可能丢失课程名或课程所在周数");
            
            //alert("丢失重要课程信息!（周数或课程名丢失）");
            console.error("即将退出");
            throw new Error("(实践)找不到课程名或课程周数");
        }
        rawWeek = div[i].children[9].children[0].data;//获取到的原始周数信息“第x周”
        
        //从一行中的各列获取信息，日期列除外,console.log用于提交
        console.log("--------------------");

        name = div[i].children[3].children[0].data;
        teacher = (div[i].children[7].children.length == 0) ? "未知" : div[i].children[7].children[0].data;
        if (teacher.length > 10){
            teacher = teacher.substring(0,10);
        }
        day = (div[i].children[11].children.length == 0) ? -1 : parseInt(div[i].children[11].children[0].data);
        position = (div[i].children[13].children.length == 0) ? "未知" : div[i].children[13].children[0].data;
        if (day == -1 ){
            console.error("课程所在星期获取失败!");
            throw new Error("(实践)不知道课程位于星期几");
        }
        //console.log("原始课程信息：" + name + "、" + teacher + "、" + "、星期" + day + "、" + position + "、" + rawWeek);

        /**
        和下一个比较，若和下一个相同，提交本组周数，进入下一个
        若和下移个不同，提交本组周数，按本组信息提交，重置周数，进入下一个
        若为最后一个，按和下一个不同记录
        */
        if (i < div.length - 1){
            //临时保存下一个未知
            nextposition = (div[i + 1].children[13].children.length == 0) ? "未知" : div[i + 1].children[13].children[0].data;
            if (name == div[i + 1].children[3].children[0].data && position == nextposition){
                //和下一个相同，先不提交课程信息，但更新周数
                submit = false;
            }else{
                //和下一个不同，提交课程信息，更新周数
                submit = true;
            }
        }else if (i == div.length - 1){
            submit = true;
        }else{
            console.error("截取到的课程原始信息有误，请检查课表页面");
            throw new Error("循环未能正确停止");
        }
        ripeWeeks.push(getWeek(rawWeek) + matchres[1]);//给周数增加了顺延参数
        //console.log("解析到一组课程？" + submit);
        //-----------submit 将确认的课程信息提交，然后需要重置submit标志和weeks数组
        if (submit){
            singleInfo = {
                "name": name,
                "position": getPosition(position),
                "teacher": teacher,
                "weeks": ripeWeeks,
                "day":day,
                "sections":[1,2,3,4],
                "C01": 0,
                "C02": 0,
                "C11": 0,
                "C21": 0,
                "C31": 0
            }
            allClassInfo_fin.push(singleInfo);
            singleInfo = {
                "name": name,
                "position": getPosition(position),
                "teacher": teacher,
                "weeks": ripeWeeks,
                "day":day,
                "sections":[6,7,8,9],
                "C01": 0,
                "C02": 0,
                "C11": 0,
                "C21": 0,
                "C31": 0
            }
            allClassInfo_fin.push(singleInfo);
            console.log("PUSHED，解析到一节课程信息：");
            console.log(singleInfo);
            ripeWeeks = new Array();
        }
        submit = false;
    }
    console.log("实践课解析结果")
    console.log(allClassInfo_fin);
    console.info("-==终止实践课解析=-");
    return allClassInfo_fin;
    
}

function getWeek(rawWeek){
    return parseInt(rawWeek.substring(1, rawWeek.length - 1));
}

function getPosition(rawPostion){
    /**
     * 截取地址信息中()内教室号等信息，若不含(（将放弃截取
     * 或许你发现了，我把参数position拼错了
     */
    let from = 0;
    for (var i = rawPostion.length - 1; i > 0; i--){
        if (rawPostion[i] == '（' || rawPostion[i] == '('){
            from = i;
            break;
        }
    }
    if (from == 0){
        console.error("截取教室信息失败，原信息为" + rawPostion);
        return rawPostion;
    }
    return rawPostion.substring(from + 1, rawPostion.length - 1);
}

/**
 * @name 合并、解决时间冲突课程
 * @author OpaqueGlass
 * @judge 判断条件：星期一致，周次有所重合，节次有所重合。
 * @return 对于存在重合的课程，靠后出现的删除重合部分后导入
 */
function mergeConflictCourse(rawResult) {
    let removeId = [];
    console.log("开始检查冲突课程...");
    //对每一个课程信息，都进行查重
    //【查重保存方式】目前采用在原rawResult基础上直接修改，用removeId记录要删除的位置，回来倒序删除
    for (let k = 0; k < rawResult.length ; k++) {
        //对每一个课程信息，倒查重复，若没有重复则进档，若有，去除重复后进档
        console.group("准备加入课程"+k+":");
        console.log(rawResult[k]);
        //倒查重复开始：【动作：发现重复，产出本课程的重复项，检查节次、周次是否为空，其一为空不导入】
        //只查10个的前提，导入的课程信息数组是按照天聚集排布的
        for (let j = k - 1; j >= 0 && j >= 0; j--) {
            console.info("与课程"+j+"比对");
            console.log(rawResult[j]);
            let temp_now_toins = rawResult[k];//移动了一下位置，如果更改了就用最新的
            let temp_alreadyExist = rawResult[j];//已经查重过的项，和它比较
            //判断是否属于同一天，如果不属于同一天，本节肯定不冲突
            if (temp_now_toins.day != temp_alreadyExist.day) {
                console.log("比对完，和课程"+j+"未发现冲突（都不属于同一天）");
                continue;
            }
            //检查周数节数的不同，将比对结果保存
            let weeksCompareRes = existSameComponent(temp_alreadyExist.weeks, temp_now_toins.weeks);
            let sectionsCompareRes = existSameComponent(temp_alreadyExist.sections, temp_now_toins.sections);
            //如果周次或节次完全不同，本课程正常添加，不做修改
            //【请注意：还要和其他课程做检查，这里判断完全不同，并不意味着和其他课程不存在冲突
            if (weeksCompareRes.result == -1 || sectionsCompareRes.result == -1){
                console.log("比对完，和课程"+j+"未发现冲突（课程周次或节次其一完全不同）");
                continue;
            }

            let newCourseTemp;//使用前记得重置为需要的，覆盖上次使用

            /*【处理周次部分重叠】将两个课程中不冲突的周次拆出另成课程对象*/
            if (weeksCompareRes.result == 1 || weeksCompareRes.result == 3){
                newCourseTemp = Object.assign({}, temp_alreadyExist);
                if (weeksCompareRes.uniqueArr1 == 0){
                    console.error("数组查重不对，不该是空数组");
                    throw new Error("数组查重出错");
                }
                newCourseTemp.weeks = weeksCompareRes.uniqueArr1;
                //这里没有清除冲突代码，如果课程是已经处理过冲突的，不知道会出啥问题，我觉得应该继承冲突代码
                rawResult.splice(k+1, 0, newCourseTemp);//将更新插入到结果数组，（不能插到最后，个人偏见，这个查重不查全部的）
                console.log("周次部分相同，新增课程对象：查重过的课程j被拆出一个，为", newCourseTemp);
                temp_alreadyExist.weeks = weeksCompareRes.sameArr;//同步为周次全部冲突情况
            }
            if (weeksCompareRes.result == 2|| weeksCompareRes.result == 3){
                //和上面的代码差不多，区别是加入的课程是已存在的还是待查重的
                newCourseTemp = Object.assign({}, temp_now_toins);
                if (weeksCompareRes.uniqueArr2 == 0){
                    console.error("数组查重不对，不该是空数组");
                    throw new Error("数组查重出错");
                }
                newCourseTemp.weeks = weeksCompareRes.uniqueArr2;
                rawResult.splice(k+1, 0, newCourseTemp);
                console.log("周次部分相同，新增课程对象：当前在分析的课程k被拆出一个，为", newCourseTemp);
                temp_now_toins.weeks = weeksCompareRes.sameArr;
            }

            /*【处理节次部分重叠】至此，已经改为课程全部周次存在冲突（不冲突的周已经拆出）*/
            if (sectionsCompareRes.result == 1 || sectionsCompareRes.result == 3){
                newCourseTemp = Object.assign({}, temp_alreadyExist);
                if (sectionsCompareRes.uniqueArr1 == 0){
                    console.error("数组查重不对，不该是空数组");
                    throw new Error("数组查重出错");
                }
                newCourseTemp.weeks = sectionsCompareRes.uniqueArr1;
                //这里没有清除冲突代码，如果课程是已经处理过冲突的，不知道会出啥问题，我觉得应该继承冲突代码
                rawResult.splice(k+1, 0, newCourseTemp);//将更新插入到结果数组，（不能插到最后，个人偏见，这个查重不查全部的）
                console.log("节次部分相同，新增课程对象：查重过的课程j被拆出一个，为", newCourseTemp);
                temp_alreadyExist.sections = sectionsCompareRes.sameArr;//同步为节次全部冲突情况
            }
            if (sectionsCompareRes.result == 2|| sectionsCompareRes.result == 3){
                newCourseTemp = Object.assign({}, temp_now_toins);
                if (sectionsCompareRes.uniqueArr2 == 0){
                    console.error("数组查重不对，不该是空数组");
                    throw new Error("数组查重出错");
                }
                newCourseTemp.sections = sectionsCompareRes.uniqueArr2;
                //这里没有清除冲突代码，如果课程是已经处理过冲突的，不知道会出啥问题，我觉得应该继承冲突代码
                rawResult.splice(k+1, 0, newCourseTemp);//将更新插入到结果数组，（不能插到最后，个人偏见，这个查重不查全部的）
                console.log("节次部分相同，新增课程对象：查重过的课程j被拆出一个，为", newCourseTemp);
                temp_now_toins.sections = sectionsCompareRes.sameArr;
            }
            /*【余下的按照全部冲突处理】 */
            
            //按照周数、节次完全相同处理
            let conflict1res = sameWeekSection(temp_alreadyExist, temp_now_toins, removeId, k);
            removeId = conflict1res.removeId;
            temp_alreadyExist = conflict1res.temp_alreadyExist;
        }
        console.groupEnd();
    }
    //给课程加上冲突标记
    //注意：必须倒序处理，放置删课程删错，删课程利用原始下标，
    //从后往前删不会更改前面的下标
    for (let a = rawResult.length - 1; a>=0; a--){
        if (rawResult[a].C01 > 0){
            rawResult[a].name = "C01>" + rawResult[a].name;
        }
        // if (rawResult[a].C02 > 0){
        //     //rawResult[a].name = "C02>" + rawResult[a].name;
        // }
        if (rawResult[a].C11 > 0){
            rawResult[a].name = "C11>" + rawResult[a].name;
        }
        if (rawResult[a].C31 > 0){
            rawResult[a].name = "C31>" + rawResult[a].name;
        }
        //如果当前判断元素在删除列表中，则删除该元素
        //将原数组下标和待删除下标做比对，因此，删除removeId数组允许重复赘余
        if (removeId.indexOf(a) != -1){
            console.log("移除课程：", rawResult[a]);
            rawResult.splice(a,1);
            
        }
    }
    console.info("完成冲突处理，处理结果为：");
    console.log(rawResult);
    return rawResult;
}
/**
 * @name 判断两个数组是否包含相同的元素
 * @author OpaqueGlass
 * @param 前两个：比对数组1,2
 * @param 第三个：要删除的元素下标保存位置
 * @param 最后一个：我要知道要下标，才能将下标保存到removeId
 * @return_type JSON格式
 * @return result 结果类型判断码
 * -1>两个数组完全不同； 0>两个数组完全相同； 
 * 1>数组1包含数组2；2>数组2包含数组1；3>有交集但没有包含关系
 * @return sameArr 数组中相同的元素
 * @return uniqueArr2 数组arr2中独有的元素
 * @return uniqueArr1 数组1中独有的元素
 */
function existSameComponent(arr1, arr2) {
    //找arr2中独有的元素
    let arr2_unique = arr2.filter(function(val) {
        return arr1.indexOf(val) == -1;
    });
    //找相同的部分
    let arr_same = arr2.filter(function(val) {
        return arr1.indexOf(val) != -1;
    });
    //找arr1中独有的元素
    let arr1_unique = arr1.filter(function(val) {
        return arr2.indexOf(val) == -1;
    });;
    let result;
    //开始判断情况
    if (arr_same.length == 0){
        //没有相同元素，返回-1
        result = -1;
    }else if (arr1_unique.length == 0 && arr2_unique.length == 0){
        //两个输入数组没有独有元素，返回0（完全相同）
        result = 0;
    }else if (arr1_unique.length != 0 && arr2_unique.length == 0){
        result = 1;//数组2是数组1的子集（数组1包含数组2）
    }else if (arr1_unique.length == 0 && arr2_unique.length != 0){
        result = 2;//数组1是数组2的子集
    }else{
        result = 3;//部分重合
    }
    return {
        "result": result,
        "sameArr": arr_same,
        "uniqueArr2": arr2_unique,
        "uniqueArr1": arr1_unique,
        "uniqueArr": [[],arr1_unique, arr2_unique]
    }
}
/**
 * @name 课程相同周、相同节处理
 * @author OpaqueGlass
 * @param 已经存在的课程，正在查重的课程，要删除的课程下标
 * @return_type 对象/json
 * @return removeId需要删除的课程号（更新后）
 * @return temp_alreadyExist已经存在的课程信息（更新后）
 */
function sameWeekSection(temp_alreadyExist, temp_now_toins, removeId, k){
    if (temp_now_toins.name == temp_alreadyExist.name && temp_now_toins.teacher == temp_alreadyExist.teacher){
        console.log("两个课程名、教师一致，下面检查是否有相同地点");
        if (temp_alreadyExist.position.indexOf(temp_now_toins.position) == -1){
            console.log("C01冲突：一个课程有两个上课地点");
            temp_alreadyExist.position += "或" + temp_now_toins.position;
            temp_alreadyExist.C01++;
        }else{
            console.log("（C02冲突）两个课程信息完全一致，只导入第一个");
            //temp_alreadyExist.C02++;
        }
        removeId.push(k);//课程重复（或只是地点不一致，其他重复）重复已处理，删除多余的
        // continue;
    }else{
        console.log("课程不一致：确实冲突");
        //处理方式：先导入的课程占据共有时间的第一个小节，后导入的课程占据共有时间的其他小节
        //若导入的课程只占据一个小节，后导入的课程删除。
        //尝试合并
        temp_alreadyExist.name += "|" + temp_now_toins.name;
        temp_alreadyExist.teacher += "|" + temp_now_toins.teacher;
        temp_alreadyExist.position += "|" + temp_now_toins.position;
        console.log("C31:两个课程只有一个小节，还冲突了，尝试合并");
        removeId.push(k);//正在加入k课程，发现和之前的冲突，k课程不添加
        temp_alreadyExist.C31++;
        // continue;
    }

    return {
        "temp_alreadyExist": temp_alreadyExist,
        "removeId": removeId
    }
}