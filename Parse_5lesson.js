function scheduleHtmlParser(html) {
    /**
     * @name HEU Theory Lessons Parser 按大节导入
     * @version v0.2.1-Parser-5max-
     * 本次更新：课程信息缺失处理
     * @author OpaqueGlass
     * @contact https://github.com/OpaqueGlass/HEU_Timetable_Parser/
     */
    let errorReport = [{
        name: "抱歉，处理课程信息失败(。﹏。*)",
        position: "",
        teacher: "如果可以，请将错误信息发送给开发者",
        weeks: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
        day: 1,
        sections: [1,2,3,4,5,6,7,8,9,10,11,12]
    }];
    try{//抛出错误，调试环境禁用
    const $ = cheerio.load(html); //该代码用于使用cheerio，并导入html
    /*确定是否进行冲突课程处理 */
    let userConflictConfirm = $('#conflictHandler').text();
    console.log(userConflictConfirm);
    if (userConflictConfirm == "true"){
        userConflictConfirm = true;
    }else{
        userConflictConfirm = false;
    }
    /*课表处理 */
    var row_Count = 0; //为获取表格行id，使用的循环标记
    var first = $('#kbtable input'); //获取kbtable 下input元素，
    var first_length = first.attr("value").length; //表格行id特征字段长
    let table_row = ["5180478CC0C746CC94534AF06163E809-",
            "2B924210E3384CBE9A571BB503BB1E22-",
            "25BA0015D76143439BD0271B2178E1A2-",
            "0C53A76700E5489D95958B991966C069-",
            "FC68CEFDF4F4426FA780FFE0C12409ED-"
        ] //课程表表格的行对应的id（特征部分），按大节拆分，0对应第一大节
        //开始获取id
    while (row_Count <= 4) {
        //获取特征id（位于属性value中），并截取掉变化的部分
        table_row[row_Count] = first.attr("value").substring(0, first_length - 3);
        //table_row[row_Count] = table_row[row_Count].substring(0, first_length-3);//赘余行
        console.log(table_row[row_Count]);
        row_Count++;
        //请尝试替换aaa，考虑使用
        first = first.parent().parent().next().children().next().children(); //转移到下一个first元素
    }
    //获取id结束
    console.log("获取id结束");
    /*  变量声明 */
    let allInfo = []; //最后的信息交到这里
        //调试时设定的初始值
    var row = 4; //大节号
    var column = 2; //星期x/
    /* 变量声明结束 */
    //这里开始循环
    //debug模式
    for (column = 1; column <= 7; column++) {
        for (row = 1; row <= 5; row++) {
            //读取当日、该节时段的全部课程
            console.group("(" + row + "," + column + ")");
            console.info("第" + row + "大节，星期" + column);
            console.info("大节基本信息");
            //获取本行id，-2为详细的课程信息
            var relaventID = table_row[row - 1] + column + '-2'; //详
            //获取本日本节中全部的课程源数据
            let newRawData = $('#' + relaventID).toArray()[0];
            
            newRawData = newRawData.children; //尝试缩减代码
            let lengthRD = newRawData.length;
            console.log("详细课程信息数组");
            console.log(newRawData);

            //判定跳出（无课程）
            if (lengthRD == 1) {
                console.groupEnd();
                if (column == 7) console.groupEnd();
                continue;
            } //如果无课程，跳过
            //空白课程对象，注意，星期，节次已经设定了值
            let nullInfo = {
                name: "未知",
                position: "未知",
                teacher: "未知",
                weeks: [0],
                day: column,
                sections: [row],
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
                    }
                }
                if (k == newRawData.length - 1 || (newRawData[k].type == "text" && newRawData[k].data.indexOf("-----------") != -1)){
                    //提交课程信息，另外，循环完了也要提交
                    console.log("提交本次内容，创建新的结构，读取下一组课程信息", collecting);
                    allInfo.push(collecting);
                    collecting = Object.assign({}, nullInfo);
                    console.groupEnd();
                }
                //console.log();
            }
            console.groupEnd();
            
        } //终止行内每列循环
    } //这里终止行循环

    //console.log(singleInfo);
    console.log("Submit and return(END)(Allinfo showing below)");
    console.log(allInfo);
    if (userConflictConfirm){
        return mergeConflictCourse(allInfo);
    }else{
        return allInfo;
    }
    }catch(err){
        console.error(err);
        errorReport[0].position = err.message;
        return errorReport;
    }
    //return allInfo;
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
    //警告：由于教务系统实际上没有实现单双周（1-5单周）之类的显示，这里补充的替换
    //仅用于在2021-2022-1学期出现1,3,5,7(单周)时处理用，不能处理1-5(单周)
    // data = data.replace("(单周)", "");
    // data = data.replace("(双周)", "");
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
        return -2;
    }
    
    return result;
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
        if (removeId.indexOf(k) != -1){
            //如果此节已经位于移除数组，此节不处理
            continue;
        }
        //倒查重复开始：【动作：发现重复，产出本课程的重复项，检查节次、周次是否为空，其一为空不导入】
        //只查10个的前提，导入的课程信息数组是按照天聚集排布的
        for (let j = k - 1; j >= k - 10 && j >= 0; j--) {
            console.group("与课程"+j+"比对",rawResult[j]);
            //console.log();
            let temp_now_toins = rawResult[k];//移动了一下位置，如果更改了就用最新的
            let temp_alreadyExist = rawResult[j];//已经查重过的项，和它比较
            //判断是否属于同一天，如果不属于同一天，本节肯定不冲突
            if (temp_now_toins.day != temp_alreadyExist.day) {
                console.log("比对完，和课程"+j+"未发现冲突（都不属于同一天）");
                console.groupEnd();
                continue;
            }
            //检查周数节数的不同，将比对结果保存
            let weeksCompareRes = existSameComponent(temp_alreadyExist.weeks, temp_now_toins.weeks);
            let sectionsCompareRes = existSameComponent(temp_alreadyExist.sections, temp_now_toins.sections);
            console.log("周次直接比对结果：", weeksCompareRes);
            //如果周次或节次完全不同，本课程正常添加，不做修改
            //【请注意：还要和其他课程做检查，这里判断完全不同，并不意味着和其他课程不存在冲突
            if (weeksCompareRes.result == -1 || sectionsCompareRes.result == -1){
                console.log("比对完，和课程"+j+"未发现冲突（课程周次或节次其一完全不同）");
                console.groupEnd();
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
                console.log("原值weeks", temp_now_toins.weeks)
                // if (weeksCompareRes.uniqueArr2 == 0){
                //     console.error("数组查重不对，不该是空数组");
                //     throw new Error("数组查重出错");
                // }
                console.log("测试uniquearr2值，应该和新增的一样",weeksCompareRes.uniqueArr2)
                newCourseTemp.weeks = weeksCompareRes.uniqueArr2;
                console.log(newCourseTemp.weeks);
                rawResult.splice(k+1, 0, newCourseTemp);
                console.log("周次部分相同，新增课程对象：当前在分析的课程k被拆出一个，为", newCourseTemp);
                temp_now_toins.weeks = weeksCompareRes.sameArr;
            }

            /*【处理节次部分重叠】至此，已经改为课程全部周次存在冲突（不冲突的周已经拆出）*/
           //节次均为单节，不会重叠
            /*【余下的按照全部冲突处理】 */
            
            //按照周数、节次完全相同处理
            let conflict1res = sameWeekSection(temp_alreadyExist, temp_now_toins, removeId, k);
            removeId = conflict1res.removeId;
            temp_alreadyExist = conflict1res.temp_alreadyExist;
            console.groupEnd();
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
        if (rawResult[a].C21 > 0){
            rawResult[a].name = "C21>" + rawResult[a].name;
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
        //处理方式：在同一单元格合并显示（字符串拼接）
    
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

function clearConflictCode(input){
    input.C01 = input.C02 = 0;
    return input;
}