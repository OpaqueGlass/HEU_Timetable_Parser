let info2String =  function(){
    return `{{${this.name} [${this.weeks.toString()}]周 [${this.sections.toString()}]小节 ${this.teacher} ${this.position}}}`;
}
/**
 * @name HEU Theoretics and Practice Lessons Parser
 * @version 0.6.0
 * @author OpaqueGlass
 * @contact https://github.com/OpaqueGlass/HEU_Timetable_Parser/
 */
function scheduleHtmlParser(html){
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
        /*判断是否包含工程实践课程*/
        //Provider传入格式 选择信息*#*##*#*理论课表*#*##*#*实践课表(如果有)
        let result;
        let htmlArray = html.split("*#*##*#*");
        if (htmlArray.length >=3){
            let theoryLessons;
            theoryLessons = theoryLessonParserJZJW(htmlArray[1]);
            let practiceTableCheerio;
            //工程实践
            try{
                practiceTableCheerio = cheerio.load(htmlArray[2]);
            }catch(err){
                throw new Error("工程实践课表粘贴格式不正确");
            }
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
        }else if (htmlArray.length < 3){//工程实践
            result = practiceScheduleHtmlParser(cheerio.load(htmlArray[1]), matchres)
        }

        //合并重复课程
        result = mergeSameCourses(result);
        return result;
    }catch(err){
        let bugReport = [{
            name: "抱歉，处理课程时出现错误>_<",
            position: "a ",
            teacher: "a ",
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
    
}

/**
 * 
 * @param {String} html Provider_JZJW/scheduleHtmlProvider的返回值
 * @returns 
 */
 function theoryLessonParserJZJW(html, havePra) {
    let result = new Array();
    
    let rawClassInfos = JSON.parse(html);
    rawClassInfos.forEach(function(current){
        let temp = {
            name: current.KCM, // 课程名称
            position: getPositionJZJW(current), // 上课地点
            teacher: getTeacherJZJW(current), // 教师名称
            weeks: getWeeksJZJW(current), // 周数
            day: current.SKXQ, // 星期
            sections: getSectionsJZJW(current), // 节次
        }
        if (temp.name.indexOf("工程实践") == -1){//不为工程实践才加入课程
            result.push(temp);
        }
        
    });
    return result
}

function getWeeksJZJW(info){
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

function getSectionsJZJW(info){
    let result = new Array();
    for (let i = info.KSJC; i <= info.JSJC; i++) result.push(i);
    return result;
}

function getTeacherJZJW(info){
    let data = info.SKJS;
    if (!isValidStr(data)) return "未知";
    return data;
}

function getPositionJZJW(info){
    let data = info.JASMC;
    if (!isValidStr(data)) return "未知";
    return data;
}

function isValidStr(data){
    if (data == undefined || data == null || data == "") return false;
    return true;
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