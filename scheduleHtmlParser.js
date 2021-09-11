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

function scheduleHtmlParser(html) {
    /**
     * @name HEU Theory Lessons Parser
     * @version 0.4.2
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
    var all = 0;//导入课程计数
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
        //获取本日本节中全部的课程源数据
        let newRawData = $('#' + relaventID ).toArray()[0];

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
            singleInfo = {
                "name": lname,
                "position": llocation,
                "teacher": lteacher,
                "weeks": getWeek(lweek),
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
   let finalResult = {
       "courseInfos": allInfo,
       "sectionTimes": sections
   }
   return finalResult;
}


function getWeek(data){
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