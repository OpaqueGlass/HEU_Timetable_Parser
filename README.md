# HEU_Timetable_Parser_in_Xiaoai

## 概述

此脚本用于将教务系统网页html文本转换为小爱课程表可以理解的课程对象。

上传的代码只是一个（组）用于解析课表的函数，此脚本不能直接运行，至少需要node.js cheerio才能运行。

因为本人的技术不高、完全是小白，这里展示的代码有较多的冗余，但也希望这能作为适配其他学校教务系统的参考。

### 反馈bug || 继续维护 ?

感谢你访问到这里，可能你在导入课表时遇到了一些问题，但抱歉，此项目已经不再、也无法继续维护（教务系统对我已经403了）。

作为替代，Wakeup课程表是一个优秀的课表App，你可以尝试使用那个。

当然，如果还想使用小爱课表，可以换一个导入项目（例如：[Holit大佬开发的](https://github.com/Holit/HEU_edusys_miui)）、联系其他开发大佬或自己新开一个适配项目。

Javascript入门很简单，即使你的专业和计算机关系不大，也可以轻松开始（[MDN文档](https://developer.mozilla.org/zh-CN/docs/learn/JavaScript)）。

除了基本的函数、变量知识以外，为了修复bug（或者重新写个新的），你可能还需要参考的一些文档：

- Fetch https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API/Using_Fetch

- 小爱课程表开发者工具使用教程（其中也有视频教程） https://open-schedule-prod.ai.xiaomi.com/docs/#/help/

如果你打算获取课表页面的相关信息，而不是通过网络请求，可能还需要参考：

- CSS选择器 https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Selectors

- [jQuery](https://www.runoob.com/jquery/jquery-tutorial.html)
  （个人认为用`document.querySelectorAll()`能胜任大多数情况）

- https://www.cnblogs.com/holittech/p/miui_schedule_document.html

### 文件组成

```
-  LICENSE 开源协议
-  Parser_withPracticeLesson.js （强智+金智混合导入）解析理论课表+工程实践课表【已过时】
-  Parse_5lesson.js （旧教务，强智教务）按大节解析理论课表【已过时】
-  Provider.js （旧教务，强智教务）截取课表网页内容【已过时】
-  Provider_withPracticeLesson.js （旧教务，强智教务）截取课表网页内容、请求理论课表【已过时】
-  Parser_JZJW.js 解析教务系统返回的课程信息【2022金智教务】
-  Provider_JZJW.js 向教务系统发送POST请求课程信息【2022金智教务】
-  Timer_JZJW.js 返回课程时间表（通用）
-  README.md 说明文档
```



## 参考资料&感谢
> 以下资料对这个脚本的诞生至关重要，在此表示感谢

SZTU深圳技术大学教务系统小爱课程表导入——强智科技13369 （作者：源心锁  ）

https://blog.csdn.net/qq_38331169/article/details/108500577?utm_source=app

官方说明文档

https://ldtu0m3md0.feishu.cn/docs/doccnhZPl8KnswEthRXUz8ivnhb#line-41

cheerio说明文档（官方）
https://cheerio.js.org/

cheerio说明文档（中文翻译）
https://www.jianshu.com/p/629a81b4e013

> 向大佬致敬（更简洁优美的HEU课程表适配实现）

Holit: HEU本科生教务系统在小爱的导入

https://www.cnblogs.com/holittech/p/miui_schedule_document.html

https://github.com/Holit/HEU_edusys_miui

## 更新日志

2022-9-18 尝试适配新教务系统（金智教务）。

2022-8-14 课表分析器修复拆课周数错误问题，改进：开学前获取的是上学期的理论课表。

2022-3-1 课表分析器html对大节内课程的处理方式更新，课程冲突处理方案修复拆课重复的问题，在三个项目里全面使用新的周数判断方案，新增按大节导入课程。

2022-2-16 课表分析器分析html获取课程信息本身并没有变化，新增冲突课程处理（beta）。

> 新版本0.4.0（第四版）的更改受Holit:HEU_edusys_miui项目的启发，本项目（理论课表分析器v0.4.x）只是对大佬思路的拙劣模仿。
> 具体地，从第四版（0.4.0）起，换用jQuery(cheerio) children获取课程信息的方式，不再使用获取全部文本再拆分的方式获取课程名、教师名、上课地点和上课时间等信息。参考了大佬的jQuery获取思路和课表部分信息为空的错误处理方式。

2021-10-23 \[适配\]工程实践课表；\[适配\]由于2021秋季学期工程实践课程顺延导致的课程错位1周的问题；{理论课表分析器（v0.4.2b）工程实践课表分析器（v0.1.1）合并版本（v0.1.6）}

2021-09-10 换用jQuery(cheerio) children获取课程信息的方式，修复单双周识别错误的问题（0.4.1，此版本未上传，0.4.2保留了该修复），修复课程数大于5时导入崩溃的问题（0.4.2）。（第四版）

2021-08-27 修复了issue5（#5）对应的问题，此版本可以勉强完成导入工作。（第三版）

2020-11-23 修复了issue3对应的问题，现在导入无课程地点的项目不会再卡死了。（第二版）

2020-10-04 上传第一代版本，同步在小米审核。

2020-10-03 在本地编辑、调试代码。（此部分代码没有上传）
