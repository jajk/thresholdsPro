# thresholdsPro
该组件由四部分组成：

1、模板，见index.html中的template，在“选取告警时间”中，我并没有将00:00-23:45的时间一一列举完，只是列举了些特例，可自行增删；

2、图标，见./img/delete.png；

3、样式，见./css/thresholds.css；

4、脚本，见./js/thresholds.js，由于该脚本采用backbone编写，固在此之前，还需引入backbone.js、underscore.js、jquery.js，详见./js/library/*.js。

在上述部分引入页面后，你只需要实例化构造函数ThresholdComponent(str, objStr)，即可创建对应的告警列表，其中ThresholdComponent包括两个可选的参数，如下：

    --str<string>，为告警阈值字符串，形式如："< 1 ,(23:00 15:00) > 8 9 10,(02:00 20:00) = 5"，在列表初始化时，将解析并图形化传入的str;
    --objStr<string>，将生成的告警列表填入该objStr的定位元素中，默认为'body'。

最后，当你操作完告警列表后，你只需点击Save按钮，即可得到对应的告警阈值字符串，我通过console.log，将其打印在了控制栏中。
