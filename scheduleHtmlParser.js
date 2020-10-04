function scheduleHtmlParser(html) {
    //除函数名外都可编辑
    //2020-10-4修正了id，使id可以获取，不在代码中写死，以支持其他学期的导入
    const $ = cheerio.load(html);
    const $value = $('#kbtable input').attr('name');
    var row_Count = 0;
    var first = $('#kbtable input');
    var first_length = first.attr("value").length;
    console.log("first_length"+first_length);
    let table_row = 
    ["5180478CC0C746CC94534AF06163E808-",
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
    console.log($('#kbtable input').parent().parent().next().children().next().children().attr("value"));
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
    let allInfo = new Array();
    let singleInfo;
    var all = 0;
    //这里开始循环
    var row = 3;//大节号
    var column = 4;//星期x
    for (row = 1;row<=5;row++){
        for (column = 1;column <=7;column++){
        //读取当日、该节时段的全部课程，并保存到rawData
        console.info("循环中...("+row+","+column+")");
        var relaventID = table_row[row-1] + column + '-2';
        console.log(relaventID);
        var relaventID2 = table_row[row-1] + column + '-1';
        let rawData=$('#' + relaventID ).text();//
        let rawSimpleData = $('#' + relaventID2).text();
        
        var  coursesInfo = rawSimpleData.split('---------------------');//拆分单个的课程信息，并保存为数组
    //21个-
        console.log(rawSimpleData);

        var numOfCourse = coursesInfo.length;//总共有课程numOfClass个
        var location=$("#" + relaventID).find("font");
        var i = 0;
        
        console.log("圈定课程信息范围"+location);
        console.info(numOfCourse);
        console.log(rawSimpleData=='');
        var beginwith = 0;//寻找课程名的开始位置，应当及时更新以排除上一个课的影响(不需要在以下循环中清零，只需要更新位置即可)
        while (i < numOfCourse){
           //在这里判定跳出
           console.log("h");
           console.log($("#" + relaventID).attr('title',"老师").text().length);
           if ($("#" + relaventID).attr('title',"老师").text().length==1){
               break;
           }
           

            //处理课程名【已经无法独立出来了】
            //请注意，课程名的处理以简略课表为数据源(rawSimpleData)
            if (numOfCourse >=2){
                //寻找(周)
                var signal = rawSimpleData.indexOf("(周)", beginwith);
                //以(周)为基准，向前寻找非数字的项目，找到后记为课程名的结束下标
                while (rawSimpleData.substring(signal-1,signal)[0]<=9 
                && rawSimpleData.substring(signal-1,signal)[0]>=0 
                || rawSimpleData.substring(signal-1,signal)[0]=='-'
                || rawSimpleData.substring(signal-1,signal)[0]==',' ){
    //                 console.log("into");
                    signal--;
                }
                var name = rawSimpleData.substring(beginwith,signal);
                beginwith = rawSimpleData.indexOf("---------------------", beginwith)+22;
    //             console.log("name=="+name);
            }else if (numOfCourse == 1){
                var signal = rawSimpleData.indexOf("(周)");
                while (rawSimpleData.substring(signal-1,signal)[0]<=9 
                && rawSimpleData.substring(signal-1,signal)[0]>=0 
                || rawSimpleData.substring(signal-1,signal)[0]=='-'
                || rawSimpleData.substring(signal-1,signal)[0]==',' ){
                    signal--;
                }
                var name = rawSimpleData.substring(0,signal);
            }
            //处理课程名【完】

            var rawWeek = location[4*i+1].children[0].data;
            var ripeWeek = getWeek(rawWeek);
            var rawClass = location[4*i+2].children[0].data;
            var ripeClass = getClass(rawClass);
            day = column;

            //记为已经成功处理了一个课程
            singleInfo = {
                "name": name,
                "position": location[4*i+3].children[0].data,
                "teacher":location[4*i+0].children[0].data,
                "weeks":ripeWeek,
                "day":column,
                "sections":getClass(rawClass)
            }
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

    var result = new Array(25);
    for (i=0;i<25;i++){
        result[i]=-1;

    }
//     console.info("开始获取周数");
//     console.log(data.length);
    data = data.substring(0,data.length-3);
//     console.log(data);
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
    var j = 0;
    while (result[j] != -1){
//         console.log(result[j]);
        j++;
    }//当没有课程时，会出问题，长度为0的数组
    var result2 = new Array(j);
    j = 0;
    while (result[j]!=-1){
        result2[j]=result[j];
        j++;
    }
    return result2;
}

function getClass(data){
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
    console.log(data);
    var i = 1;
    var count = 0;
    var j = 0;
    var result = new Array(13);
    while (count<result.length){
        result[count]=0;
        count++;
    }
    count = 0;
    while (data[i]!='节'){
        result[count]=parseInt(data.substring(i,i+2));
        count++;
        i+=2;
    }
    var result2 = new Array(count);
    while (result[j]!=0){
        result2[j]=sections[result[j]-1];
        j++;
    }
    return result2;
}