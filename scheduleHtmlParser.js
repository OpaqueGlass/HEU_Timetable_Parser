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
    //除函数名外都可编辑
    //2020-10-4修正了id，使id可以获取，不在代码中写死，以支持其他学期的导入
    
    const $ = cheerio.load(html);
    const $value = $('#kbtable input').attr('name');
    var row_Count = 0;
    var first = $('#kbtable input');
    var first_length = first.attr("value").length;
    let table_row = 
    ["5180478CC0C746CC94534AF06163E809-",
    "2B924210E3384CBE9A571BB503BB1E22-",
    "25BA0015D76143439BD0271B2178E1A2-",
    "0C53A76700E5489D95958B991966C069-",
    "FC68CEFDF4F4426FA780FFE0C12409ED-"]//课程表表格的行对应的id（特征部分），按大节拆分，0对应第一大节
    //开始获取id
    while(row_Count <= 4){
        table_row[row_Count] = first.attr("value");
        table_row[row_Count] = table_row[row_Count].substring(0, first_length-3);
        console.log(table_row[row_Count]);
        row_Count++;
        first = first.parent().parent().next().children().next().children();
    }
    //获取id结束
    
    let allInfo = new Array();
    let singleInfo;
    var all = 0;
    //这里开始循环
    var row = 3;//大节号
    var column = 4;//星期x
    for (row = 1;row<=5;row++){
        for (column = 1;column <=7;column++){
        //读取当日、该节时段的全部课程，并保存到rawData
        var pre;
        console.info("循环中...("+row+","+column+")");
        var relaventID = table_row[row-1] + column + '-2';
        var relaventID2 = table_row[row-1] + column + '-1';
        let rawData=$('#' + relaventID ).text();//
        let rawSimpleData = $('#' + relaventID2).text();
        var modify = 0;//发现错误时，用它来移除错误
        var locid = 0;//为了避免错误，设定一个id来保存当前位置

        var  coursesInfo = rawSimpleData.split('---------------------');//拆分单个的课程信息，并保存为数组//21个-
        console.log(rawSimpleData);

        var numOfCourse = coursesInfo.length;//总共有课程numOfClass个
        console.log("NumOfCourse"+numOfCourse);
        var location=$("#" + relaventID).find("font");
        var i = 0;
        
        var beginwith = 0;//寻找课程名的开始位置，应当及时更新以排除上一个课的影响(不需要在以下循环中清零，只需要更新位置即可)
        while (i < numOfCourse){
            var countii = 0;
           //在这里判定跳出
           console.log("正在判断格内课程："+i+" / "+numOfCourse);
           console.log(location);
           if ($("#" + relaventID).attr('title',"老师").text().length==1){
               break;
           }
            //处理课程名【已经无法独立出来了】
            //请注意，课程名的处理以简略课表为数据源(rawSimpleData)
            if (numOfCourse >=2){
                //寻找(周)
                var signal = rawSimpleData.indexOf("(周)", beginwith);
                // loc = 
                //以(周)为基准，向前寻找非数字的项目，找到后记为课程名的结束下标
                while (rawSimpleData.substring(signal-1,signal)[0]<=9 
                && rawSimpleData.substring(signal-1,signal)[0]>=0 
                || rawSimpleData.substring(signal-1,signal)[0]=='-'
                || rawSimpleData.substring(signal-1,signal)[0]==',' ){
                    signal--;
                }
                var name = rawSimpleData.substring(beginwith,signal);
                beginwith = rawSimpleData.indexOf("---------------------", beginwith)+22;//设定下一项寻找位置
                console.log("name=="+name);
            }else if (numOfCourse == 1){
                var signal = rawSimpleData.indexOf("(周)");//周字的位置，方便定位
                while (rawSimpleData.substring(signal-1,signal)[0]<=9 
                && rawSimpleData.substring(signal-1,signal)[0]>=0 
                || rawSimpleData.substring(signal-1,signal)[0]=='-'
                || rawSimpleData.substring(signal-1,signal)[0]==',' ){
                    signal--;
                }
                var name = rawSimpleData.substring(0,signal);
            }
            //处理课程名【完】
            
            for(locid = 0;locid<1;locid++){//如果存在数据缺失，这部分需要重新再来
                // var testWeek = $("#" + relaventID).find("font").attr('title',"老师");
                // console.log("测试用0"+testWeek);
                var rawWeek = location[4*i+1+modify].children[0].data;
                
                console.log("获取到的原始周数信息为"+rawWeek);
                var ripeWeek = getWeek(rawWeek);
                //检查其返回的数据，如果是-1说明无法解析周数/节数

                if (ripeWeek == -1){
                    modify --;//无法解析周数意味着数据错位（缺失数据）减一个试试
                    locid--;//用来返回重新判断的，js不能使用goto，而且大范围的continue会使之前的名字丢失
                    continue;
                }
                var rawClass = location[4*i+2+modify].children[0].data;
                console.log("获取到原始节数信息为"+rawClass);
                //检查其返回的数据，如果是-1说明无法解析周数/节数
                var ripeClass = getClass(rawClass);
                if (ripeClass == -1){
                    modify --;
                    locid--;
                    continue;
                }
                console.log(ripeClass);
                day = column;
            }
            // console.log(judge(location[4*i+3+modify].children[0].data));
            
            if ((4*i+3+modify)>=location.length ||judge(location[4*i+3+modify].children[0].data)!="地"){//长度判定很重要，为了缺失最后一鞥导致崩溃
                //用以检查要写为地点的字符串是不是地点，不是则填写未保存数据
                allInfo[all-1]=(singleInfo);
                singleInfo = {
                "name": name,
                "position": "抱歉，未找到数据",
                "teacher":location[4*i+0+modify].children[0].data,
                "weeks":ripeWeek,
                "day":column,
                "sections":getClass(rawClass)
            }
            }else{
                singleInfo = {
                "name": name,
                "position": location[4*i+3+modify].children[0].data,
                "teacher":location[4*i+0+modify].children[0].data,
                "weeks":ripeWeek,
                "day":column,
                "sections":getClass(rawClass)
            }
            }
            //记为已经成功处理了一个课程

            pre = singleInfo;//啊，本来是想出了问题之后用上一个数据替代的，但是上个数据也有问题，
            allInfo[all]=(singleInfo);
            all++;
            i++;
        }
   }} //这里终止循环
   console.log("endTime");
   console.log(singleInfo);
    return { courseInfos: allInfo ,
        sectionsTimes:sections
    }
}
function getWeek(data){
    var i = 0;
    var count = 0;
    var begin = 0, end = 0;
    if (judge(data)=="师" || judge(data)=="地"){//在获取课程/周数的函数中都加入了对于项目参数的判定，为了防止由于缺失上课地点而导致的崩溃
        return -1;
    }
    var result = new Array();
    data = data.substring(0,data.length-3);
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

function getClass(data){

    console.log(data);
    var i = 1;
    var count = 0;
    var j = 0;
    var result = new Array();
    count = 0;
    if (judge(data)=="师" ||judge(data)=="地" ){//在获取课程/周数的函数中都加入了对于项目参数的判定，为了防止由于缺失上课地点而导致的崩溃
        return -1;
    }
    while (data[i]!='节'){
        result[count]=sections[parseInt(data.substring(i,i+2))-1];
        count++;
        i+=2;
        if (i>=20){
            return -1;//一直循环说明判断错了，返回修正
        }
    }
    return result;
}

function judge(textt){//用来判断给定的文本是哪种类型的文本
    var i;
    var hasnum = 0;
    for (i = 0; i<textt.length; i++){
        if (textt[i]=="周"){
            return "周";
        }else if (textt[i]=="节"){
            return "节";
        }
        if ((textt[i]>=48 && textt[i]<=57 )||(textt[i]<=9)){
            hasnum = 1;
        }
        if (i == textt.length-1 && hasnum == 1){
            return "地";
        }
        else if (i== textt.length-1 &&hasnum == 0){
            return "师";
        }

    }
}