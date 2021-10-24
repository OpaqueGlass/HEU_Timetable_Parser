let sections = [
    {
        "section": 1, "startTime": "08:00", "endTime": "08:45"
    },{
        "section": 2, "startTime": "08:50", "endTime": "09:35"
    },{
        "section": 3, "startTime": "09:55", "endTime": "10:40"
    },{
        "section": 4, "startTime": "10:45", "endTime": "11:30"
    },{
        "section": 5, "startTime": "11:35", "endTime": "12:20"
    },{
        "section": 6, "startTime": "13:30", "endTime": "14:15"
    },{
        "section": 7, "startTime": "14:20", "endTime": "15:05"
    },{
        "section": 8, "startTime": "15:25", "endTime": "16:10"
    },{
        "section": 9, "startTime": "16:15", "endTime": "17:00"
    },{
        "section": 10, "startTime": "17:05", "endTime": "17:50"
    },{
        "section": 11, "startTime": "18:30", "endTime": "19:15"
    },{
        "section": 12, "startTime": "19:20", "endTime": "20:05"
    },{
        "section": 13, "startTime": "20:10", "endTime": "20:55"
    }
];
let sectionA = [
    {
        "section": 1, "startTime": "08:00", "endTime": "08:45"
    },{
        "section": 2, "startTime": "08:50", "endTime": "09:35"
    },{
        "section": 3, "startTime": "09:55", "endTime": "10:40"
    },{
        "section": 4, "startTime": "10:45", "endTime": "11:30"
    }
];
let sectionB = [
    {
        "section": 6, "startTime": "13:30", "endTime": "14:15"
    },{
        "section": 7, "startTime": "14:20", "endTime": "15:05"
    },{
        "section": 8, "startTime": "15:25", "endTime": "16:10"
    },{
        "section": 9, "startTime": "16:15", "endTime": "17:00"
    }
];
function scheduleHtmlParser(html){
    /**
     * @name HEU Theoretics and Practice Lessons Parser
     * @version 0.1.6
     * 实践课程分析更新
     * @author OpaqueGlass
     * @contact https://github.com/OpaqueGlass/HEU_Timetable_Parser/
     */
    let div = $('tr').toArray();//将列表行listrow转为数组形式储存
    if (div.length <= 10){
        console.info("认定无工程实践课信息，仅导入学期理论课表");
        var fin = theoreticsScheduleHtmlParser(html, false);
    }else{
        console.info("认定有工程实践课信息，工程实践课将被详细课程方案替换");
        let InfosA = theoreticsScheduleHtmlParser(html, true);
        let InfosB = practiceScheduleHtmlParser(html);
        var fin = InfosA.concat(InfosB);
    }
    
    
    return {
        "courseInfos": fin,
        "sectionTimes": sections
    }
    
}
function theoreticsScheduleHtmlParser(html, havePra) {
    /**
     * @name HEU Theory Lessons Parser
     * @version 0.4.2b  此版本在原有版本上进行了havePra更改，用于判断是否需要删去“工程实践”
     * 
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
    let singleInfo;//这里临时保存
    var seemsNumofLesson = 0;
    var seemsLessonsLength = 0
        //调试时设定的初始值
    var row = 4;//大节号
    var column = 2;//星期x/
    /* 变量声明结束 */
    //这里开始循环
    for (row = 1;row <= 5;row++){
        for (column = 1;column <= 7;column++){
        //读取当日、该节时段的全部课程
        console.group("("+row+","+column+")");
        console.info("第"+row+"大节，星期"+column);
        console.group("大节基本信息");
        //获取本行id，-2为详细的课程信息
        var relaventID = table_row[row-1] + column + '-2';//详
        var relaventID2 = table_row[row-1] + column + '-1';//略
        let rawData=$('#' + relaventID ).text();//复杂信息原文
        let rawSimpleData = $('#' + relaventID2).text();//简明信息原文
        //获取本日本节中全部的课程源数据
        let newRawData = $('#' + relaventID ).toArray()[0];
        let newRawSimpleData = $('#' + relaventID2).toArray();

        newRawData = newRawData.children;//尝试缩减代码
        let lengthRD = newRawData.length;
        console.log("详细课程信息数组");
        console.log(newRawData);
        
        //该代码无法判断多于5节课的情况，因此之后安排了修正
        //这里将课程按照10元素记录了，但多课程引入了2元素的---分隔，所以课程记录数是偏多的
        //当课程数大于5时，开始出错（bug已修复）
        seemsNumofLesson = Math.floor(lengthRD / 10);
        console.log("认定含有课程x节：" + seemsNumofLesson);
        seemsLessonsLength = seemsNumofLesson * 10 + (seemsNumofLesson - 1) * 2;
        //console.log(newRawData.length == seemsLessonsLength);
        console.log(lengthRD + " " + seemsLessonsLength);
        console.groupEnd();
        //判定跳出（无课程）
        if (lengthRD == 1){
            console.groupEnd();
            if (column == 7) console.groupEnd();
            continue;
        }//如果无课程，跳过
        //检查课程长度和已知是否一致
        if (lengthRD != seemsLessonsLength){
            console.log("认定本组课程信息缺失或课程数判断错误");
            //由于我们将课程长按10记录，实际除了第一个为12，因此课程记录偏多，这里用j--
            for (let j = seemsNumofLesson; j > 1; j--){
                //找到符合条件的课程数，使得其匹配现在的情况
                if ((j * 10 + (j - 1) * 2) == lengthRD){
                    seemsNumofLesson = j;
                    break;
                }
            }
            seemsLessonsLength = seemsNumofLesson * 10 + (seemsNumofLesson - 1) * 2;
        }
        //检查上面的循环是否修正了错误
        if (lengthRD != seemsLessonsLength){
            console.error("课程长度判断错误。");
            return 0;
        }
        for (let i = 0; i < seemsNumofLesson; i++){
            let lname = newRawData[12 * i + 0].data;
            let lteacher = (newRawData[12 * i + 2].children == undefined)?"未知":newRawData[12 * i + 2].children[0].data;
            let lweek = newRawData[12 * i + 4].children[0].data;
            let lduring = newRawData[12 * i + 6].children[0].data;
            let llocation = (newRawData[12 * i + 8].children == undefined)?"未知":newRawData[12 * i + 8].children[0].data;
            
            console.group("同节不同周-第" + (i + 1) + "个课");
            console.log("课程名：" + lname);
            console.log("教师；" + lteacher);
            console.log("周次：" + lweek);
            console.log("节次：" + lduring);
            console.log("教室：" + llocation);
            let lsection = getSections(lduring);
            if (lsection == -2) console.info(">>全天课程<<");
            if (lsection == -2 && row == 1){
                lname += "(疑似全天)";
                lsection = [sections[0]];
            }
            console.groupEnd();
            if (lsection == -2 && row >1){
                console.log("重复的全天课程不导入");
                continue;
            }
            if (lname == "工程实践(疑似全天)" && havePra){//如果有工程实践课详细信息，则不导入工程实践课
                console.log("不再导入工程实践课程");
                continue;
            }
            singleInfo = {
                "name": lname,
                "position": llocation,
                "teacher": lteacher,
                "weeks": getWeeks(lweek),
                "day": column,
                "sections": lsection
            }
            allInfo.push(singleInfo);
            console.log(singleInfo);
        }

        console.groupEnd();
        }//终止行内每列循环
   } //这里终止行循环
   
   //console.log(singleInfo);
   console.log("Submit and return(END)(Allinfo showing below)");
   console.log(allInfo);
   
   return allInfo;
}


function getWeeks(data){
    var i = 0;
    var count = 0;
    var begin = 0, end = 0;
    var result = new Array();
    data = data.replace("(周)", "");
    data = data.replace("(单周)", "");
    data = data.replace("(双周)", "");
    var several = data.split(',');
    i = 0;
    while (i < several.length){
        if (several[i].indexOf('-')==-1){
            result[count]=parseInt(several[i]);
            count++;
        }else{
            begin = parseInt(several[i].substring(0, several[i].indexOf('-')));
            end = parseInt(several[i].substring(several[i].indexOf('-')+1,several[i].length));

            while (begin<=end){
                result[count]=begin;
                begin++;
                count++;
            }
        }
        i++;
    }
    return result;
}

function getSections(data){

    console.log(data);
    var i = 1;
    var count = 0;
    var j = 0;
    var result = new Array();
    count = 0;
    while (data[i]!='节'){
        result[count]=sections[parseInt(data.substring(i,i+2))-1];
        count++;
        i+=2;
        if (i>=20){
            return -1;//一直循环说明判断错了，返回修正
        }
    }
    console.log("课程内节数测试"+result.length);
    if (result.length == 1 && result[0] == sections[0]){//检查全天课程特征项
        console.log("该课程仅一节");
        return -2;
    }
    return result;
}
function practiceScheduleHtmlParser(html) {
    /**
     * @name HEU Practice Lessons Parser
     * @version 0.1.1 
     * 此版本对21秋课程进行了强制适配
     * @author OpaqueGlass
     * @contact https://github.com/OpaqueGlass/HEU_Timetable_Parser/
     */
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
    for (i = 10;i < div.length; i++){
        /**在使用v0.2版混合HTML获取时，将理论课表和实践课表进行了强制合并，请注意 理论课表含8个<tr>
         * 因此，请从i = 10开始，以排除无效的理论课表行（列标题行1+五大节课5+备注行1+实践课表个人信息行1+实践课表列标题行1）
         * 
         * 本循环一并将连续的课程合并输出
         */
        //加入周数、课程名缺失检验防范崩溃
        if (div[i].children[3].children.length == 0 || div[i].children[9].children.length == 0){
            console.error("课程信息不完整，可能丢失课程名或课程所在周数");
            alert("丢失重要课程信息!（周数或课程名丢失）");
            console.error("即将退出");
            return null;
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
            alert("丢失关键课程信息（星期几）");
            return [];
        }
        //console.log("原始课程信息：" + name + "、" + teacher + "、" + "、星期" + day + "、" + position + "、" + rawWeek);

        /**
        和下一个比较，若和下一个相同，提交本组周数，进入下一个
        若和下移个不同，提交本组周数，按本组信息提交，重置周数，进入下一个
        若为最后一个，按和下一个不同记录
        */
        if (i != div.length - 1){
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
            return [];
        }
        ripeWeeks.push(getWeek(rawWeek));
        //console.log("解析到一组课程？" + submit);
        //-----------submit 将确认的课程信息提交，然后需要重置submit标志和weeks数组
        if (submit){
            singleInfo = {
                "name": name,
                "position": getPosition(position),
                "teacher": teacher,
                "weeks": ripeWeeks,
                "day":day,
                "sections":sectionA
            }
            allClassInfo_fin.push(singleInfo);
            singleInfo = {
                "name": name,
                "position": getPosition(position),
                "teacher": teacher,
                "weeks": ripeWeeks,
                "day":day,
                "sections":sectionB
            }
            allClassInfo_fin.push(singleInfo);
            console.log("PUSHED，解析到一节课程信息：");
            console.log(singleInfo);
            ripeWeeks = new Array();
        }
        submit = false;
    }

    console.log("-==终止实践课解析=-");
    return allClassInfo_fin;
    
}

function getWeek(rawWeek){
    /**2021年10月23日
     * 修复：工程实践课程延期问题
     * getWeek仅用于工程实践课程周数分析
     */
    var week = parseInt(rawWeek.substring(1, rawWeek.length - 1));
    var date_ = new Date();
    var year = date_.getFullYear();
    if (week >= 6 && year == 2021){
        week++;
    }
    return week;
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