let info2String =  function(){
    return `{{${this.name} [${this.weeks.toString()}]周 [${this.sections.toString()}]小节 ${this.teacher} ${this.position}}}`;
}
/**
 * @name HEU Theoretics and Practice Lessons Parser
 * @version 0.5.0
 * @author OpaqueGlass
 * @contact https://github.com/OpaqueGlass/HEU_Timetable_Parser/
 */
function scheduleHtmlParser(html){
    let errorReport = [{
        name: "抱歉，处理课程信息失败(。﹏。||)",
        position: " ",
        teacher: " ",
        weeks: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
        day: 1,
        sections: [1,2,3,4,5]
    },{
        name: "开发者QQ",
        position: "1354457997",
        teacher: "如果可以，请将错误信息发送给开发者",
        weeks: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
        day: 2,
        sections: [1,2,3,4,5]
    },{
        name: "错误位置信息",
        position: " ",
        teacher: " ",
        weeks: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],
        day: 1,
        sections: [6,7,8,9,10]
    }];
    try{
    /*检测并处理工程时间课程顺延请求 */
    const $ = cheerio.load(html)
    let userChoice = $('#practiceDelay').text();
    let reg = "^[0-9]+-[0-9]+$";//正则，用于获取第一个正确格式输入
    let matchres = userChoice.match(reg);//正则匹配结果
    if (matchres != null && matchres.length != 0){
        matchres = matchres[0].split('-');//获得数组，下标0：原开始周次，1推迟后周次
    }else{
        matchres = [1,1];
    }
    /*检测并处理冲突课程处理请求*/
    let conflictConfirm = false;
    let userConflictConfirm = $('#conflictHandler').text();
    if (userConflictConfirm === "true"){
        conflictConfirm = true;
    }
    /*判断是否包含工程实践课程*/
    //Provider传入格式 选择信息*#*##*#*理论课表*#*##*#*实践课表(如果有)
    let result;
    let htmlArray = html.split("*#*##*#*");
    if (htmlArray.length >=3){
        let theoryLessons = theoryLessonParser(cheerio.load(htmlArray[1]), true);
        let practiceLessons = practiceScheduleHtmlParser(cheerio.load(htmlArray[2]), matchres);
        //课程信息有效性判断
        if (theoryLessons.length >= 1 && practiceLessons.length >= 1){
            result = theoryLessons.concat(practiceLessons);
        }else if (theoryLessons.length >= 1){
            result = theoryLessons;
        }else if (practiceLessons.length >= 1){
            result = practiceLessons;
        }else if (theoryLessons.length < 1 && practiceLessons.length < 1){
            throw new Error("没有获取到任何课程");
        }else{
            throw new Error("开发者也不知道发生了什么");
        }
    }else if (htmlArray.length < 3){//仅理论课程
        result = theoryLessonParser(cheerio.load(htmlArray[1]), false);
    }
    //合并重复课程
    result = mergeSameCourses(result);
    

    //处理错误的课程延长
    // result = fixExtend(result);
    
    //不执行冲突课程处理则直接返回
    if (conflictConfirm == false){
        return result;
    }

    //冲突课程处理
    return mergeConflictCourse(result);

    }catch(err){
        errorReport[0].position += err.message;
        errorReport[0].teacher += err.message.substring(25);
        //返回调用信息，49为全英文输出+1占位空格
        errorReport[2].position += err.stack.substring(err.stack.indexOf("at"));
        errorReport[2].teacher += err.stack.substring(err.stack.indexOf("at")).substring(49);
        return errorReport;
    }
    
}

/**
 * @name 理论课表分析器
 * @param {function} $ cheerio函数
 * @param {bool} havePra 工程实践课程标志 true 去除工程实践 
 * @returns 课表信息数组
 */
 function theoryLessonParser($,havePra){
    /*课表处理 */
    let bigSectionId = getBigSectionId($);
    //获取id结束
    let result = []; //最后的信息交到这里
    //let moreSections = [[0], [1, 2], [3, 4, 5], [6, 7], [8, 9, 10], [11, 12, 13]];//大节所包含的小节
    //这里开始循环
    for (let column = 1; column <= 7; column++) {
        for (let row = 1; row <= 5; row++) {
            //读取当日、该节时段的全部课程
            //获取本行id，-2为详细的课程信息
            var relaventID = bigSectionId[row] + column + '-2'; //详
            //获取本日本节中全部的课程源数据
            let rawData = $('#' + relaventID).toArray()[0].children;
            let lengthRD = rawData.length;
            do{
                if (lengthRD <= 1) {
                    //如果无课程，跳过
                    break;
                }
                let tempCoursesInSection = getCoursesInBigSection(rawData, getDefaultInfo(column, row, 1), havePra);
                if (tempCoursesInSection.length <= 0 && !havePra){//没有工程实践（工程实践会移除）还获取不到课程信息，这不对
                    throw new Error("E处理大节内课程信息失败@"+column+","+row);
                }
                result.push.apply(result, tempCoursesInSection);
            }while (0);
        } //终止行内每列循环
    } //这里终止行循环
    return result;
}
/**
 * @name 获取大节内的课程信息
 * @param rawData 原始大节课程信息
 * @param defaultInfo 对应本天、本大节的空白课程信息对象
 * @param havePra 是否需要移除工程实践课程标志
 * @return 课程信息数组
 */
 function getCoursesInBigSection(rawData, defaultInfo, havePra){
    let result = [];
    //空白课程对象，注意，星期，节次已经设定了
    let collecting = copyLessonInfo(defaultInfo);//新找到的内容填在这里
    for (k in rawData){
        if (rawData[k].type == "text" && rawData[k].data.indexOf("-----------") == -1){
            collecting.name = rawData[k].data;
        }
        if (rawData[k].type == "tag" && rawData[k].name =="font"){
            switch (rawData[k].attribs.title){
                case "老师":
                case "教师": 
                    if (rawData[k].children == undefined)break;
                    collecting.teacher = rawData[k].children[0].data;
                    break;
                case "周次":
                    if (rawData[k].children == undefined)break;
                    collecting.weeks = getWeeks(rawData[k].children[0].data);
                    break;
                case "教室":
                case "地点":
                    if (rawData[k].children == undefined)break;
                    collecting.position = rawData[k].children[0].data;
                    break;
                case "节次":
                    if (rawData[k].children == undefined)break;
                    collecting.originalSections = getSections(rawData[k].children[0].data);
                    //只在多个小节的时候，按照小节信息导入，否则，按照所在大节导入
                    if (collecting.originalSections.length != 1){
                        collecting.sections = collecting.originalSections;
                    }else{
                        collecting.oneSection++;
                    }
                    break;
            }
        }
        if (k == rawData.length - 1 || (rawData[k].type == "text" && rawData[k].data.indexOf("-----------") != -1)){
            //提交课程信息，另外，循环完了也要提交
            if (collecting.name.indexOf("工程实践") != -1 && havePra){
                collecting = copyLessonInfo(defaultInfo);
                continue;//若有工程实践，本课程移除，不加入
            }
            result.push(collecting);
            collecting = copyLessonInfo(defaultInfo);
        }
    }
    return result;
}

/**
 * @name 获取大节课程特征id
 * @returns 大节对应id数组，[1]对应第一大节特征id
 */
 function getBigSectionId($){
    var inputs = $('#kbtable input'); //获取kbtable 下input元素，
    var idLength = inputs.attr("value").length; //表格行id特征字段长
    var result = [""];
    for (let i = 0; i < inputs.length; i+=14){
        result.push(inputs.eq(i).attr("value").substring(0, idLength - 3));
    }
    return result;
}



/**
 * @name 获取理论课课表返回值模板
 * @param {int} day 
 * @param {int} bigSection 
 * @param {int} mode 1则将填充对应大节的所有小节
 * @returns 已填充默认值的课程信息模板
 */
 function getDefaultInfo(day, bigSection, mode = 0){
    let result = {
        name: "未知",
        position: "未知",
        teacher: "未知",
        weeks: [0],
        day: day,
        sections: [0],
        multiPosition: 0,//课程存在多个上课地点
        hasConflict: 0,//课程存在冲突
        hasSame: 0, //课程存在跨大节的连续
        oneSection: 0, //课程只上一个小节（长时间连上的课程候选）
        originalSections: [0], //来自课表的直接课程信息
        toString: info2String//输出
    }
    if (mode){
        let moreSections = [[0], [1, 2], [3, 4, 5], [6, 7], [8, 9, 10], [11, 12, 13]];
        result.sections = moreSections[bigSection];
    }
    return result;
}


/**
 * @name 修正错误的课程拓展
 * @param {array} courses 待修正的课程信息数组
 */
 function fixExtend(courses){
    //当前状态：由于先不扩展节数，导致长时间课的相同课被判定删除，所以只保留了第一节
    //如果改为节数扩展，则由于扩展后的长时间课的节数不相同，导致裁剪
    for (k in courses){
        if (courses[k].oneSection != 0 && courses[k].hasSame == 0){
            //如果课程只有一个小节，并且无相同课程，应当认为需要恢复原值、不应拓展
            courses[k].sections = courses[k].originalSections;
            if (courses[k].sections.length != 1){
                throw new Error("修正课程拓展失败");
            }
        }
    }
    return courses;
} 

/**
 * @name 理论课表获取周数
 * @param {String} data 课表中周数部分原始字符串 
 * @returns {int[]} 周数数组 
 */
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
    }else if (data.indexOf("双周") != -1){
        singleWeek = 2;
        data = data.replace("(双周)", "");
    }
    var several = data.split(',');
    i = 0;
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
/**
 * @version 0.3
 * @name 理论课表获取节数信息
 * @detail
 * 本次更新换用了新的section结构，不再使用含有时间的json，采用数组。
 */
function getSections(data) {
    var i = 1;
    var count = 0;
    var result = new Array();
    count = 0;
    while (data[i] != '节') {
        result[count] = parseInt(data.substring(i, i + 2));
        count++;
        i += 2;
        if (i >= 90) {
            return -1; //一直循环说明判断错了，返回修正
        }
    }
    if (result.length == 1 && result[0] == 1) { //检查全天课程特征项
    }
    
    return result;
}
/******************************** 分析工程实践课表 ********************/
function practiceScheduleHtmlParser($,matchres) {
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
    let i = 2;
    let submit = false;
    for (i = 2 + matchres[0];i < div.length; i++){
        /**在v0.3版Provider中，课表html获取做了拆分
         * 为排除无效的理论课表行（实践课表个人信息行1+实践课表列标题行1），i的初始值应当设置为2
         * 
         * 本循环一并将连续的课程合并输出
         */
        getDetails();
        /**
        和下一个比较，若和下一个相同，提交本组周数，进入下一个
        若和下移个不同，提交本组周数，按本组信息提交，重置周数，进入下一个
        若为最后一个，按和下一个不同记录
        */
        if (i < div.length - 1){
            //临时保存下一个未知
            nextposition = (div[i + 1].children[13].children.length == 0) ? "未知" : div[i + 1].children[13].children[0].data;
            nextposition = getPosition(nextposition);
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
            throw new Error("循环未能正确停止");
        }
        ripeWeeks.push(getWeek(rawWeek) + matchres[1]);//给周数增加了顺延参数
        //-----------submit 将确认的课程信息提交，然后需要重置submit标志和weeks数组
        if (submit){
            singleInfo = {
                "name": name,
                "position": position,
                "teacher": teacher,
                "weeks": ripeWeeks,
                "day":day,
                "sections":[1,2,3,4],
                multiPosition: 0,//课程存在多个上课地点
                hasConflict: 0,//课程存在冲突
                hasSame: 0, //课程存在跨大节的连续
                oneSection: 0, //课程只上一个小节（长时间连上的课程候选）
                originalSections: [1,2,3,4], //来自课表的直接课程信息
                toString: info2String,//输出
            }
            allClassInfo_fin.push(singleInfo);
            singleInfo = {
                "name": name,
                "position": position,
                "teacher": teacher,
                "weeks": ripeWeeks,
                "day":day,
                "sections":[6,7,8,9],
                multiPosition: 0,//课程存在多个上课地点
                hasConflict: 0,//课程存在冲突
                hasSame: 0, //课程存在跨大节的连续
                oneSection: 0, //课程只上一个小节（长时间连上的课程候选）
                originalSections: [6,7,8,9], //来自课表的直接课程信息
                toString: info2String,//输出
            }
            allClassInfo_fin.push(singleInfo);
            ripeWeeks = new Array();
        }
        submit = false;
    }
    return allClassInfo_fin;
    
    function getDetails(){
        //加入周数、课程名缺失检验防范崩溃
        if (div[i].children[3].children.length == 0 || div[i].children[9].children.length == 0){
            throw new Error("(实践)找不到课程名或课程周数");
        }
        rawWeek = div[i].children[9].children[0].data;//获取到的原始周数信息“第x周”

        name = div[i].children[3].children[0].data;
        teacher = (div[i].children[7].children.length == 0) ? "未知" : div[i].children[7].children[0].data;
       
        day = (div[i].children[11].children.length == 0) ? -1 : parseInt(div[i].children[11].children[0].data);
        position = (div[i].children[13].children.length == 0) ? "未知" : div[i].children[13].children[0].data;
        position = getPosition(position);//在未知情况下，此函数能够输出原始值（//TODO:历史遗留问题，应该保存返回值的先不管了）
        if (day == -1 ){
            throw new Error("(实践)不知道课程位于星期几");
        }

    }
}

function getWeek(rawWeek){
    return parseInt(rawWeek.substring(1, rawWeek.length - 1));
}

/**获取工程实践地点
 * @param rawPostion 原始工程实践地点信息
 * 截取地址信息中()内教室号等信息，若不含(（将放弃截取，若最后一个字符不为)）将放弃截取
 * 或许你发现了，我把参数position拼错了
 */
function getPosition(rawPostion){
    
    let from = 0;
    if (rawPostion == "") return "未知";
    try{
        let lastChar = rawPostion.substring(rawPostion.length-1);
        if (lastChar != ")" && lastChar != "）") return rawPostion;
        for (var i = rawPostion.length - 1; i > 0; i--){
            if (rawPostion[i] == '（' || rawPostion[i] == '('){
                from = i;
                break;
            }
        }
        if (from == 0){
            return rawPostion;
        }
        return rawPostion.substring(from + 1, rawPostion.length - 1) + `(${rawPostion.substring(0, from)})`;
    }catch(err){
        return rawPostion;
    }
    
}
/*************************************课程通用处理（冲突课程和合并课程） */
/**
 * @name 合并、解决时间冲突课程
 * @author OpaqueGlass
 * @judge 判断条件：星期一致，周次有所重合，节次有所重合。
 * @return 对于存在重合的课程，靠后出现的删除重合部分后导入
 */
function mergeConflictCourse(rawResult) {
    let removeId = [];
    //对每一个课程信息，都进行查重
    //【查重保存方式】目前采用在原rawResult基础上直接修改，用removeId记录要删除的位置，回来倒序删除
    for (let k = 0; k < rawResult.length ; k++) {
        //对每一个课程信息，倒查重复，若没有重复则进档，若有，去除重复后进档
        //倒查重复开始：【动作：发现重复，产出本课程的重复项，检查节次、周次是否为空，其一为空不导入】
        //只查10个的前提，导入的课程信息数组是按照天聚集排布的
        for (let j = k - 1; j >= 0 && j >= 0; j--) {
            
            let temp_now_toins = rawResult[k];//移动了一下位置，如果更改了就用最新的
            let temp_alreadyExist = rawResult[j];//已经查重过的项，和它比较
            //判断是否属于同一天，如果不属于同一天，本节肯定不冲突
            if (temp_now_toins.day != temp_alreadyExist.day) {
                continue;
            }
            //检查周数节数的不同，将比对结果保存
            const weeksCompareRes = existSameComponent(temp_alreadyExist.weeks, temp_now_toins.weeks);
            const sectionsCompareRes = existSameComponent(temp_alreadyExist.sections, temp_now_toins.sections);
            
            //如果周次或节次完全不同，本课程正常添加，不做修改
            //【请注意：还要和其他课程做检查，这里判断完全不同，并不意味着和其他课程不存在冲突
            if (weeksCompareRes.result == -1 || sectionsCompareRes.result == -1){
                continue;
            }
            if (removeId.indexOf(j) != -1){//22-8
                continue;
            }
            let newCourseTemp;//使用前记得重置为需要的，覆盖上次使用
            /*【处理周次部分重叠】将两个课程中不冲突的周次拆出另成课程对象*/
            if (weeksCompareRes.result == 1 || weeksCompareRes.result == 3){
                newCourseTemp = copyLessonInfo(temp_alreadyExist);
                if (weeksCompareRes.uniqueArr1.length == 0){
                    throw new Error("数组查重出错");
                }
                newCourseTemp.weeks = weeksCompareRes.uniqueArr1;
                //这里没有清除冲突代码，如果课程是已经处理过冲突的，不知道会出啥问题，我觉得应该继承冲突代码
                rawResult.splice(k+1, 0, newCourseTemp);//将更新插入到结果数组，（不能插到最后，个人偏见，这个查重不查全部的）
                temp_alreadyExist.weeks = weeksCompareRes.sameArr;//同步为周次全部冲突情况
            }
            if (weeksCompareRes.result == 2|| weeksCompareRes.result == 3){
                //和上面的代码差不多，区别是加入的课程是已存在的还是待查重的
                newCourseTemp = copyLessonInfo(temp_now_toins);
                if (weeksCompareRes.uniqueArr2.length == 0){
                    throw new Error("数组查重出错");
                }
                newCourseTemp.weeks = weeksCompareRes.uniqueArr2;
                rawResult.splice(k+1, 0, newCourseTemp);
                temp_now_toins.weeks = weeksCompareRes.sameArr;
            }

            /*【处理节次部分重叠】至此，已经改为课程全部周次存在冲突（不冲突的周已经拆出）*/
            if (sectionsCompareRes.result == 1 || sectionsCompareRes.result == 3){
                newCourseTemp = copyLessonInfo(temp_alreadyExist);
                if (sectionsCompareRes.uniqueArr1.length == 0){
                    throw new Error("数组查重出错");
                }
                newCourseTemp.sections = sectionsCompareRes.uniqueArr1;
                //这里没有清除冲突代码，如果课程是已经处理过冲突的，不知道会出啥问题，我觉得应该继承冲突代码
                rawResult.splice(k+1, 0, newCourseTemp);//将更新插入到结果数组，（不能插到最后，个人偏见，这个查重不查全部的）
                temp_alreadyExist.sections = sectionsCompareRes.sameArr;//同步为节次全部冲突情况
            }
            if (sectionsCompareRes.result == 2|| sectionsCompareRes.result == 3){
                newCourseTemp = copyLessonInfo(temp_now_toins);
                if (sectionsCompareRes.uniqueArr2.length == 0){
                    throw new Error("数组查重出错");
                }
                newCourseTemp.sections = sectionsCompareRes.uniqueArr2;
                //这里没有清除冲突代码，如果课程是已经处理过冲突的，不知道会出啥问题，我觉得应该继承冲突代码
                rawResult.splice(k+1, 0, newCourseTemp);//将更新插入到结果数组，（不能插到最后，个人偏见，这个查重不查全部的）
                temp_now_toins.sections = sectionsCompareRes.sameArr;
            }
            /*【余下的按照全部冲突处理】 */
            
            //按照周数、节次完全相同处理
            let conflict1res = sameWeekSection(temp_alreadyExist, temp_now_toins, removeId, k);
            removeId = conflict1res.removeId;
            temp_alreadyExist = conflict1res.temp_alreadyExist;
        }
    }
    //给课程加上冲突标记
    //注意：必须倒序处理，防止删课程删错，删课程利用原始下标，
    //从后往前删不会更改前面的下标
    for (let a = rawResult.length - 1; a>=0; a--){
        
        //如果当前判断元素在删除列表中，则删除该元素
        //将原数组下标和待删除下标做比对，因此，删除removeId数组允许重复赘余
        if (removeId.indexOf(a) != -1){
            rawResult.splice(a,1);
            
        }
    }
    return rawResult;
}

/**
 * 复制一份课程信息
 * 貌似Object Assign就可以
 * @param {*} oldInfo 
 * @returns 
 */
function copyLessonInfo(oldInfo) {
    let newWeeks = oldInfo.weeks.map((value) => value);
    let newSections = oldInfo.sections.map((value) => value);
    let newOriginalSections = oldInfo.originalSections.map((value) => value);
    let newLessonInfo = {
        name: oldInfo.name,
        position: oldInfo.position,
        teacher: oldInfo.teacher,
        weeks: newWeeks,
        day: oldInfo.day,
        sections: newSections,
        multiPosition: 0,//课程存在多个上课地点
        hasConflict: 0,//课程存在冲突
        hasSame: 0, //课程存在跨大节的连续
        oneSection: 0, //课程只上一个小节（长时间连上的课程候选）
        originalSections: newOriginalSections, //来自课表的直接课程信息
        toString: info2String,
    };
    return newLessonInfo;
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
        if (temp_alreadyExist.position.indexOf(temp_now_toins.position) == -1 &&
            temp_now_toins.position.indexOf(temp_alreadyExist.position) == -1//22-8补充反向检查，now_toins不可能被合并过(理论上用不到)
            ){
            //造成此问题，可能是由于先前一课多地课程周次不完全相同，后期拆分周次后又需要处理一课多地
            // throw new Error(`CE1先前一课多地合并失败:${temp_alreadyExist.toString()}`);
            temp_alreadyExist.position += "|" + temp_now_toins.position;
            removeId.push(k);
            temp_alreadyExist.hasConflict++;
        }else if (temp_alreadyExist.position === temp_now_toins.position){
            throw new Error(`CE2先前重复课程去重失败:${temp_now_toins.toString()},${temp_alreadyExist.toString()}`);
            //造成此问题，可能是由于先前重复课程去重失败
            // removeId.push(k);
            // temp_alreadyExist.hasSame++;
        }else{
            throw new Error(`CE3不被支持的冲突类型:${temp_now_toins.toString()},${temp_alreadyExist.toString()}`);
        }
    }else{
        if (temp_alreadyExist.name.indexOf("|") != -1){
            throw new Error("CE4两节以上课程冲突，不支持合并:" + temp_alreadyExist.name + ',' + temp_now_toins.name);
        }
        //处理方式：后导入的课程向先导入的课程合并，移除靠后的课程
        //进行合并
        temp_alreadyExist.name += "|" + temp_now_toins.name;
        temp_alreadyExist.teacher += "|" + temp_now_toins.teacher;
        temp_alreadyExist.position += "|" + temp_now_toins.position;
        removeId.push(k);//正在加入k课程，发现和之前的冲突，k课程不添加
        temp_alreadyExist.hasConflict++;
        // continue;
    }

    return {
        "temp_alreadyExist": temp_alreadyExist,
        "removeId": removeId
    }
}

/**
 * @name 合并一课多地课程、删除重复课程
 * @param {json} courses 待合并的课程组
 * @returns 处理后结果
 */
 function mergeSameCourses(courses){
    let result = [];
    for (let i = 0; i < courses.length; i++){
        for (let j = 0; j < courses.length; j++){
            //课程名相同、且课程上课时间完全一致
            if (i != j && courses[i].name === courses[j].name &&
                courses[i].day == courses[j].day &&
                courses[i].teacher == courses[j].teacher &&
                existSameComponent(courses[i].weeks, courses[j].weeks).result == 0 &&
                existSameComponent(courses[i].sections, courses[j].sections).result == 0){
                // | ******i********
                // | *********j*****
                //i < j时，i没有合并过j；而j<i时，加入j的时候应该合并过i了。
                if (i < j){
                    if (courses[i].position.indexOf(courses[j].position) == -1){
                        courses[i].position += "或" + courses[j].position;
                    }
                    //else{}如果地点完全相同，因为i是第一个，所以先加入i；j后来会判定重复，不加入j。
                }else if (i > j){
                    //此课程已经被冲突项目处理（因为相信前面已经将时间名字完全一致的课程进行了合并
                    //在i前的j已经加入，i无需加入最终课程
                    break;
                }
                
            }
            if (j == courses.length - 1){
                //成功分析到最后还没有被break，说明此课程可以被加入最终结果
                result.push(courses[i]);
            }
        }
    }
    return result;
}