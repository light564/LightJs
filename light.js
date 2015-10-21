window.light = {
    // 是否摧毁时钟
    stDestoryClock : false,
    // 是否摧毁模型
    stDestoryModel : false,
    // 时间控制
    stNowTime : null,
    // new后的Model push到后面，统一调度
    modelStack : [],
    // new后的clock
    clockStack : [],
    // 图层
    layer : [],
    // sprite 数组，new之后全部保存在此处
    spriteList : [],

    // 缓存正弦、余弦值
    sinArray : [],
    cosArray : [],

    // 暂停控制
    pauseSprite : false,
                
    isObject : function(obj){
        return obj === Object(obj);
    },

    isUndefined : function(obj){
        return obj === void 0;
    },

    isString :function(obj){
        return Object.prototype.toString.call(obj) == '[object String]';
    },

    isNumber : function(obj){
        return Object.prototype.toString.call(obj) === '[object Number]';
    },

    isArray : function(obj){
        return Array.isArray(obj);
    },

    isEmail: function(email){
        if (email.match(/[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}/) === null) {
            return false;
        }
        return true;
    },

    isMobilePhone: function(phone){
        if (phone.match(/^1(3|5|7|8|4)\d{9}$/) === null) {
            return false;
        }
        return true;
    },

    isQQNumber : function(qqNumber){
        if (qqNumber.match(/([1-9][0-9]{4})|([0-9]{6,10})/) === null) {
            return false;
        }
        return true;
    },

    getPara : function(url){
        var paraStr = url.slice(url.indexOf('?') + 1),
        paraArr = paraStr.split('&'),
        para = {},
        length = paraArr.length,
        i = null,
        end = null;

        for(i = 0; i < length; i++){
            end = paraArr[i].indexOf('=');
            para[paraArr[i].slice(0, end)] = paraArr[i].slice(end + 1);
        }

        return para;
    },

    //遍历整个对象 找到属性值
    getObjectValue : function(obj, key){
        var self = this,
        value = null;

        if (self.isString(obj)) {
            return obj;
        }

        if (self.isNumber(obj)) {
            return obj;
        }
        
        if (obj.hasOwnProperty(key)) {
            return obj[key];
        }

        for(var v in obj){
            if (self.isObject(obj[v]) && (value = self.getObjectValue(obj[v], key)) !== null) {
                return value;
            }
        }

        return value;
    },

    /* 
     * note 模板生成
     * selector:要处理的模板的标识   viewData:生成dom节点所用数据
     * 没有值返回null,对应操作为删除属性
     * each 不能有大于一个参数 tmp-each 必须为数组
     * TODO: 节点嵌套
     */
    renderView : function(selector, viewData){
        var self = this,
        templateParent = $('#template'),
        templateNode = null;
        
        if (self.isString(selector)) {
            templateNode = templateParent.find('[template='+selector+']').cloneNode(true);
        } else {
            templateNode = selector.cloneNode(true);
        }

        var childSelector = null,
        childNode = null,
        keyList = templateNode.attr('tmp-value').split(','),
        attrList = templateNode.attr('tmp-attr').split(','),
        length = keyList.length;

        for(var i = 0; i < length; i++){
            
            if (keyList[i] === '') {
                keyList.shift(i);
                length--;
                i--;
                continue;
            }

            var tempValue = self.getObjectValue(viewData, keyList[i]);
            
            if (attrList[i] === '*' || attrList[i] === '' || self.isUndefined(attrList[i])) {
                templateNode.innerHTML += tempValue;
            } else{
                templateNode.attr(attrList[i], tempValue);
            }

        }
        templateNode.attr('tmp-value',null);
        templateNode.attr('tmp-attr',null);

        if (templateNode.attr('tmp-each') !== '') {
            var eachList = templateNode.attr('tmp-each').split(','),
            eachItemList = templateNode.attr('tmp-each-item').split(',');

            length = eachList.length;
            
            for(var i = 0; i < length; i++){
                childSelector = eachItemList[i];
                var valueList = null,
                tmpChildNode = templateParent.find('[template='+childSelector+']');

                if (eachList[i] === '*') {
                    valueList = viewData;
                } else{
                    valueList = self.getObjectValue(viewData, eachList[i]);
                }

                if (!light.isArray(valueList)) {
                    valueList = [valueList];
                }
                valueList.forEach(function(v){
                    childNode = self.renderView(tmpChildNode, v);
                    templateNode.appendChild(childNode);
                });
            }
            
            templateNode.attr('tmp-each',null);
            templateNode.attr('tmp-each-item',null);
        }
        templateNode.attr('template', null);
        templateNode.style.display = 'block';

        return templateNode;
    },
    /********************************************************************************************************/
    //                                           动画区域
    //
    /********************************************************************************************************/

    //--------------------------------------------//
    //                  数学区域                  //
    //--------------------------------------------//
    // 初始化三角函数
    initSC : function(){
        var self = this;

        for(var i = 0; i < 360; i++){
            var r = i*Math.PI/180;
            self.sinArray.push(Math.sin(r));
            self.cosArray.push(Math.cos(r));
        }
    },

    sin : function(angle){
        var self = this,
        n = 0;

        angle = ~~angle;

        n = ~~(angle/360);

        if (angle < 0) {
            angle += 360 * (1 - n);
        } else{
            angle -= 360 * n;
        }

        if (angle === 360) {
            angle = 0;
        }

        return self.sinArray[angle];
    },

    cos : function(angle){
        var self = this,
        n = 0;

        angle = ~~angle;

        n = ~~(angle/360);

        if (angle < 0) {
            angle += 360 * (1 - n);
        } else{
            angle -= 360 * n;
        }

        if (angle === 360) {
            angle = 0;
        }

        return self.cosArray[~~angle];
    },
    // 取范围内随机数
    randomRange : function(begin, end){
        return Math.random()*(end - begin) + begin;
    },
    // 亮点之间的距离
    distance : function(p1, p2){
        return Math.sqrt(Math.pow(p1.x - p2.x, 2)+Math.pow(p1.y - p2.y, 2));
    },
    /*
     * note     获取向量与x+方向的夹角
     * author     Light
     * parameter p 点
     */
    getAngle : function(p, center){
        var angle = null,
        center = center ? center : {x:0, y:0},
        p = {
            x : p.x - center.x,
            y : p.y - center.y
        };

        if (p.x === 0) {
            if (p.y >= 0) {
                return 180/2;
            } else{
                return 180*3/2;
            }
        }
        // 1象限
        angle = Math.atan(p.y/p.x) * 180 / Math.PI;
        // 2象限
        if (p.x < 0 && p.y > 0) {
            angle = angle + 180;
        }
        // 3象限
        if (p.x < 0 && p.y < 0) {
            angle = angle + 180;
        }
        // 4象限
        if (p.y < 0 && p.x > 0) {
            angle = angle + 2 * 180;
        }
        return angle;
    },

    /*
     * note 获取直线方程
     * 传入参数，2个点{x:10,y:10};    
     * return Ax+By+C=0  A2,B2  边长比例
     */

    getLineFunction : function(p1, p2){
        var k = (p1.y - p2.y) / (p2.x - p1.x),
        c = -k * p1.x - p1.y;

        if (p2.x === p1.x && p1.y === p2.y) {
            return null;
        }

        if (k === Infinity || k === -Infinity) {
            return {
                'A' : 1,
                'B' : 0,
                'C' : -p1.x
            };
        }

        return {
            'A' : k,
            'B' : 1,
            'C' : c
        }
    },

    lineFunctionResult : function(l,p){
        return l.A*p.x + l.B*p.y + l.C
    },

    getLinePoint : function(l1, l2){
        if (l1.A === l2.A && l1.B === l2.B) {
            return null;
        }

        var y = (l1.A*l2.C - l2.A*l1.C)/(l2.A*l1.B - l1.A*l2.B),
        x = -(l1.B*y + l1.C)/l1.A;

        return {
            'x': x,
            'y': y
        }
    },

    /*
     * note     判断点是否在矩形区域中
     * rectangle={p1,p2,p3,p4} 顺时针，左上角第一个; l{l1,l2,l3,l4}
     */
    inRectangle : function(rect, p, l){
        var self = this,
        l = l || {l1:undefined,l2:undefined,l3:undefined,l4:undefined}
        l1 = l.l1 || self.getLineFunction(rect.p1, rect.p2),
        l2 = l.l2 || self.getLineFunction(rect.p2, rect.p3),
        l3 = l.l3 || self.getLineFunction(rect.p3, rect.p4),
        l4 = l.l4 || self.getLineFunction(rect.p4, rect.p1);

        var r1 = self.lineFunctionResult(l1,p),
        r2 = self.lineFunctionResult(l2,p),
        r3 = self.lineFunctionResult(l3,p),
        r4 = self.lineFunctionResult(l4,p);

        // 忽略可能出现的计算误差
        if (r1 * r3 <= 0 && r2 * r4 <= 0) {
            return true;
        }

        return false;
    },

    //--------------------------------------------//
    //              canvas操作区域                //
    //--------------------------------------------//
    /*
     * note     获取imageData 中 像素点的值
     * author    Light
     */

    getPixel : function(imageObj, x, y){
        var d = imageObj.data,
        w = imageObj.width,
        i = 4*(w* ~~y + ~~x);

        return {
            'r' : d[i],
            'g' : d[i + 1],
            'b' : d[i + 2],
            'a' : d[i + 3]
        }
    },

    /*
     * note     获取canvas中 某像素点的值
     * author    Light
     */
    getImgPixel : function(ctx, x, y){
        var d = ctx.getImageData(~~x, ~~y, 1, 1).data;

        return {
            'r' : d[0],
            'g' : d[1],
            'b' : d[2],
            'a' : d[3]
        }
    },

    setPixel : function(imageObj, x, y, color){
        var d = imageObj.data,
        w = imageObj.width,
        i = 4*(w* ~~y + ~~x);

        d[i] = color.r;
        d[i + 1] = color.g;
        d[i + 2] = color.b;
        d[i + 3] = color.a;

        return;
    },

    // 简谐运动
    setTriPath : function(conf){
        var sprite = conf.sprite,
        kd = conf.kd || 0.1,
        kw = conf.kw || 2,
        direction = conf.direction || 'y';

        kw = kw/Math.PI*180;
        kd *= 0.05*rem;

        sprite.customPath = function(){
            var self = this,
            that = light,
            now = that.stNowTime,//ms  当前时间
            gapTime = (now - self.old)/1000;

            if (!self.triAngle) {
                self.triAngle = 0;
            }

            self.triAngle += gapTime*kw;

            self[direction] += light.sin(self.triAngle)*kd;
        }
    },

    drawEllipse : function(conf){
        var self = this,
        context2D = conf.context2D,
        x = conf.x || 0,
        y = conf.y || 0,
        r = conf.r || 1,
        color = conf.color || '#FFF',
        scaleWidth = conf.scaleWidth || 1,
        scaleHeight = conf.scaleHeight || 1;

        context2D.save();
        context2D.scale(scaleWidth, scaleHeight);
        context2D.beginPath();
        context2D.arc(x, y, r, 0, 2*Math.PI);
        context2D.closePath();
        context2D.fillStyle = color;
        context2D.fill();
        context2D.restore()
    },

    /*
     * note     绘制图片或根据函数绘制
     * author     Light
     */
    drawImg : function(conf){
        var self = this,
        context2D = conf.context2D,
        _img = conf.img,
        x = conf.x,
        y = conf.y,
        scaleX = conf.scaleX,
        img_width = conf.imgWidth || _img.width,
        img_height = conf.imgHeight || _img.height,
        rotate = conf.rotate || 0,
        opacity = conf.opacity === undefined ? 1 : conf.opacity,
        center_x = conf.center_x || x+img_width/2,
        center_y = conf.center_y || y+img_height/2,
        typeImg = typeof(_img);

        if(!context2D){
            return;
        }

        context2D.save();
        context2D.translate(center_x, center_y);
        if (scaleX) {
            context2D.scale(-1, 1);
        }

        if (rotate) {
            context2D.rotate(rotate);
        }
        if (opacity !== 1) {
            context2D.globalAlpha = opacity;
        }
        
        if (typeImg === 'function') {
            _img();
        } else{
            context2D.drawImage(_img, x - center_x, y - center_y, img_width, img_height);
        }
        context2D.restore();
    },

    //--------------------------------------------//
    //              dom节点操作区域               //
    //--------------------------------------------//

    /*
     * note 鼠标拖动旋转
     * author Light
     */

    setTurntable : function(element, fn){
        var self = this,
        mousePosOld = {
            'x' : 0,
            'y' : 0,
            'angle' : 0
        },
        angleSum = +element.attr('style').match(/rotate\((\d+)deg\)/)[1],
        offset = element.getOffset(),
        centerPoint = {
            'x' : ~~(offset.left + element.clientWidth / 2),
            'y' : ~~(offset.top + element.clientHeight / 2)
        },
        key = false;

        if (window.isNaN(mousePosOld.angleSum)) {
            mousePosOld.angleSum = 0;
        }

        var mouseDown = function(ev){
            ev = ev || window.event; 
            if(ev.button == 2 || ev.button == 3){
                return;
            }
            var mousePos = mousePosition(ev);

            key = true;
            mousePosOld.x = ~~(mousePos.x - centerPoint.x);
            mousePosOld.y = ~~(mousePos.y - centerPoint.y);
            mousePosOld.angle = ~~(self.getAngle(mousePosOld));
        },
        mouseMove = function(ev){
            ev = ev || window.event; 
            if(ev.button == 2 || ev.button == 3 || key === false){
                return;
            }
            var mousePos = mousePosition(ev),
            gap = 0;
            mousePos.x = ~~(mousePos.x - centerPoint.x);
            mousePos.y = ~~(mousePos.y - centerPoint.y);
            mousePos.angle = ~~(self.getAngle(mousePos));
            gap = mousePos.angle - mousePosOld.angle;
            if (Math.abs(gap) < 100) {
                angleSum += mousePos.angle - mousePosOld.angle;
            } else if (gap > 0) {
                angleSum += mousePos.angle - mousePosOld.angle - 360;
            } else {
                angleSum += mousePos.angle - mousePosOld.angle + 360;
            }
            
            mousePosOld = mousePos;
            element.cssProperty('transform','rotate('+angleSum+'deg)');
            fn(angleSum);
        },
        mouseUp = function(ev){
            ev = ev || window.event;
            if(ev.button == 2 || ev.button == 3){
                return;
            }
            key = false;
            return;
        };

        element.addEventListener('mousedown', mouseDown, false);
        element.addEventListener('mousemove', mouseMove, false);
        document.addEventListener('mouseup', mouseUp, false);
    },

    //--------------------------------------------//
    //                  模型区域                  //
    //--------------------------------------------//
    /*
     * note 计时器
     * conf: 见注释
     */
    clock : function(conf){
        if (!(this instanceof light.clock)){//强制使用new
            return new light.clock(conf);
        }
        conf = conf === undefined ? {} : conf;

        var self = this;

        self.gap = conf.gap || 1000;//计时器间隔时间 单位ms
        self.loop = conf.loop || -1//-1为无限次循环   循环次数
        self.destory = conf.destory || false;//次数用尽后自毁
        self.start = Date.now();//计时器开始时间 ms
        if (!light.isUndefined(conf.noPause)) {
            self.noPause = conf.noPause;
        }else{
            self.noPause = true;
        }

        light.clockStack.push(self);

    },

    /*  
     * note     精灵
     * conf     见注释
     * 若未初始化宽度,高度，则取图片高宽
     */
    sprite : function(conf){
        if (!(this instanceof light.sprite)){//强制使用new
            return new light.sprite(conf);
        }
        var self = this,
        that = light;

        self.context2D = conf.context2D;
        self.group = conf.group || [0]; // 处于第几个页面显示,0为都显示
        self.name = conf.name || 'sprite';
        self.src  = conf.src || '';
        self.x = ~~conf.x || 0;
        self.y = ~~conf.y || 0;
        self.width = ~~conf.width || 0;
        self.height = ~~conf.height || 0;
        self.rotate = conf.rotate || 0;
        self.opacity = conf.opacity===undefined ? 1 : conf.opacity;//透明度
        self.changeOpacity = conf.changeOpacity || null;
        self.hotpot = conf.hotpot || false;//鼠标热点  true后鼠标为手型

        /*元素动作*/
        self.v = conf.v || 0;//移动速度  s
        self.angle = conf.angle || 0;//移动方向  s
        self.vx = self.v * that.cos(self.angle);// y方向速度
        self.vy = self.v * that.sin(self.angle);// x方向速度
        self.lockVx = conf.lockVx || false;
        self.lockVy = conf.lockVy || false;
        self.ax = conf.ax || 0;
        self.ay = conf.ay || 0;
        self.w = conf.w || 0;//旋转角速度  s

        /*元素范围限定*/
        self.moveTo_x = conf.moveTo_x || null;
        self.moveTo_y = conf.moveTo_y || null;
        self.rotateAngle = conf.rotateAngle || null;
        self.rotateAngleCallBack = conf.rotateAngleCallBack || null;

        /*fadein and fadeout*/
        self.fadeTime = conf.fadeTime || null;
        self.fadeFlag = conf.fadeFlag || null;
        self.fadeCallback = conf.fadeCallback || null;

        /*闪烁*/
        self.blinkStyle = conf.blinkStyle || null; // 闪烁属性，暂时只支持透明度
        self.blinkSpeed = conf.blinkSpeed || null; // 闪烁速度
        self.blinkCount = conf.blinkCount || null; // 闪烁次数
        self.blinkBegin = conf.blinkBegin || null; // 起始的透明度
        self.blinkEnd   = conf.blinkEnd || null; // 结束的透明度
        self.blinkFlag   = conf.blinkFlag || null; // 标识  增加还是减少
        self.blinkCallback = conf.callback || null; 

        /*改变大小*/
        self.oldWidth = conf.oldWidth || null;
        self.oldHeight = conf.oldHeight || null;
        self.changeTime = conf.changeTime || null;
        self.changeWidth = conf.changeWidth || null;
        self.changeHeight = conf.changeHeight || null;
        self.changeSizeCallback = conf.changeSizeCallback || null;

        /*旋转中心*/
        self.rotateCenterX = conf.rotateCenterX || null;
        self.rotateCenterY = conf.rotateCenterY || null;

        /*水平翻转*/
        self.scaleX = conf.scaleX || false;
        /*停止计算*/
        self.noLayer = false;
        /*拒绝执行light的暂停*/
        self.noPause = conf.noPause;

        self.animations = [];
        self.curAnimation = 'Default';//当前播放的动画名
        self.curFrame = 0;//当前显示的图片序号
        self.frameStart = Date.now();//一帧动画开始的时间（结束后刷新）
        self.old = self.frameStart;//移动前的时间

        self.destoryOutside = false;
        self.destory = false;

        light.spriteList.push(self);
    },


    /*
     * note 水纹效果
     * conf 见注释， context2D, imageData必选
     */
    waterModel : function(conf){

        if (!(this instanceof light.waterModel)){//强制使用new
            return new light.waterModel(conf);
        }

        conf = conf === undefined ? {} : conf;

        var self = this;
        self.width = conf.width || 500,
        self.height = conf.height || 400,
        self.evolving = conf.evolving || false,//是否继续扩散
        self.damping = conf.damping || 0.98,//能量衰减
        self.clipping = conf.clipping || 5,//最大幅度
        self.evolveThreshold = conf.evolveThreshold || 0.02,//最小幅度
        self.lightRefraction = conf.lightRefraction || 5.0,
        self.lightReflection = conf.lightReflection || 0.01,
        self.context2D = conf.context2D,
        self.imgDataIn = conf.imageData,
        self.pixelsIn = conf.imageData.data,
        self.amplitudeMap1 = new Array(self.width+2),
        self.amplitudeMap2 = new Array(self.width+2);

        for(var i = 0; i < self.width+2; i++){
            self.amplitudeMap1[i] = new Array(self.height+2);
            self.amplitudeMap2[i] = new Array(self.height+2);

            for(var j = 0; j < self.height+2; j++){
                self.amplitudeMap1[i][j] = 0.0;
                self.amplitudeMap2[i][j] = 0.0;
            }
        }

        self.pointWaterArray = [
            [1.25,1.25,1.25,1.25,1.25,1.25,1.25],
            [1.25,1.45,1.45,1.45,1.45,1.45,1.25],
            [1.25,1.45,1.65,1.65,1.65,1.45,1.25],
            [1.25,1.45,1.65,1.85,1.65,1.45,1.25],
            [1.25,1.45,1.65,1.65,1.65,1.45,1.25],
            [1.25,1.45,1.45,1.45,1.45,1.45,1.25],
            [1.25,1.25,1.25,1.25,1.25,1.25,1.25],
        ];
        self.touchWaterArray = [
            [0.15,0.15,0.15],
            [0.15,0.25,0.15],
            [0.15,0.15,0.15],
        ];
        self.rainWaterArray = [
            [0.15,0.15,0.15,0.15,0.15],
            [0.15,0.25,0.25,0.25,0.15],
            [0.15,0.25,0.55,0.25,0.15],
            [0.15,0.25,0.25,0.25,0.15],
            [0.15,0.15,0.15,0.15,0.15],
        ];

        light.modelStack.push(self);

        return self;
    },

    /*
     * note 下雪
     * conf 见注释， context2D必选
     */
    snowModel : function(conf){
        if (!(this instanceof light.snowModel)){//强制使用new
            return new light.snowModel(conf);
        }

        var self = this;
        self.width = conf.width || 500,
        self.height = conf.height || 400,
        self.bgColor = conf.bgColor || '#6B92B9',
        self.context2D = conf.context2D,
        self.flakeNum = conf.flakeNum || 50,            // 雪花数目
        self.flakeArr = [],                                // 雪花数组，各种属性
        self.r = conf.r || 2,                            // 半径最大值-1
        self.opacityMax = conf.opacityMax || 0.9,         // 透明度范围最大值
        self.opacityMin = conf.opacityMin || 0.3,        // 透明度范围最小值
        self.angle = 0.0,                                // 三角函数控制移动
        self.vk = conf.vk || 0.5,
        self.windPower = conf.windPower || 1.0,
        self.windDamp = conf.windDamp || 0.96,             // 吹后阻尼
        self.snowsCoverCanvas = conf.snowsCoverCanvas || null
        self.snowsCoverData = conf.snowsCoverData || null,    // 积雪覆盖
        self.other = null;

        if (!self.snowsCoverData) {
            self.snowsCoverData = self.snowsCoverCanvas.getImageData(0, 0, self.width, self.height);
        }

        light.modelStack.push(self);

        self.initFlakeArr();
        self.draw();
    },

    //--------------------------------------------//
    //                  控制区域                  //
    //--------------------------------------------//

    destoryIterm : function(stackList){
        var stackListTemp = [],
        length = stackList.length;

        for(var i = 0; i < length; i++){
            if (!stackList[i].destory) {
                stackListTemp.push(stackList[i]);
            }
        }

        return stackListTemp
    },

    destoryItermInArr : function(){
        var self = this,
        layerLength = self.layer.length,
        spriteLength = self.spriteList;

        for(var i = 0; i < layerLength; i++){
            self.layer[i] = self.destoryIterm(self.layer[i]);
        }

        self.spriteList = self.destoryIterm(self.spriteList);
    },

    groupDo : function(conf){
        var self = this,
        spriteLength = self.spriteList.length,
        groupNumArr = conf.groupNumArr || [0], // 数组传递 表明操作的是哪个数组
        groupFn = conf.groupFn, // 选定goup各元素执行的函数
        groupKey = conf.groupKey || false, // false 为正选，true为反选
        newGroup = [], // 选出来的数组元素
        groupNumArrLength = groupNumArr.length,
        newGroupLength = 0,
        key = null;

        for(var i = 0; i < spriteLength; i++){
            key = false;
            for(var j = 0; j < groupNumArrLength; j++){
                // 如果选定的是这个组
                if (!groupKey && self.spriteList[i].group.indexOf(groupNumArr[j]) !== -1) {
                    newGroup.push(self.spriteList[i]);
                    break;
                } else if(groupKey && self.spriteList[i].group.indexOf(groupNumArr[j]) !== -1){
                    key = true;
                    break;
                }
            }
            if (key === false) {
                newGroup.push(self.spriteList[i]);
            }
        }

        newGroupLength = newGroup.length;

        if (groupFn) {
            for(var i = 0; i < newGroupLength; i++){
                groupFn.call(newGroup[i]);
            }
        }

        return newGroup;
    },

    /*
     * note 运行model和clock
     */

    run : function(){
        var self = light,
        modelLength = null,
        clockLength = null;

        self.stNowTime = Date.now();

        if (self.stDestoryModel) {
            self.stDestoryModel = false;
            self.modelStack = self.destoryIterm(self.modelStack);
        }
        modelLength = self.modelStack.length;

        for(var i = 0; i < modelLength; i++){
            self.modelStack[i].run();
        }

        if (self.stDestoryClock) {
            self.stDestoryClock = false;
            self.clockStack = self.destoryIterm(self.clockStack);
        }
        clockLength = self.clockStack.length;

        for(var i = 0; i < clockLength; i++){
            self.clockStack[i].run();
        }

        requestAnimFrame(self.run);
    }
}

light.initSC();

// 将元素粘贴到图层数组与精灵数组中
// 此处拓展了所有数组元素，稍后修改
light.layer.constructor.prototype.pushDestoryEle = function(element){
    var self = this;

    if (self.indexOf(element) === -1) {
        self.push(element);
    }

    if (light.spriteList.indexOf(element) === -1) {
        light.spriteList.push(element);
    }

    return element;
}

//----------------------------------------------//
//                    精灵                      //
//----------------------------------------------//

light.sprite.prototype.draw = function(_img, x, y, img_width, img_height, rotate, opacity){
    var self = this;

    if(!(x && y)){
        x = self.x;
        y = self.y;
    }
    if(!rotate){
        rotate = self.rotate;
    }
    if(!img_width){
        img_width = self.width;
    }
    if(!img_height){
        img_height = self.height;
    }
    if(opacity == null){
        opacity = self.opacity;
    }

    light.drawImg({
        'context2D' : self.context2D,
        'img' : _img,
        'x' : x,
        'y' : y,
        'imgWidth' : img_width,
        'imgHeight' : img_height,
        'rotate' : rotate/180*Math.PI,
        'opacity' : opacity,
        'center_x' : self.rotateCenterX,
        'center_y' : self.rotateCenterY,
        'scaleX' : self.scaleX
    });
}

// 绘制圆角矩形
// 以中心为原点
light.sprite.prototype.rRectangle = function(conf){
    var self = this,
    ctx = self.context2D,
    r = conf.r || 0,
    x = conf.x || 0,
    y = conf.y || 0,
    width = conf.width || self.width,
    height = conf.height || self.height;

    if (width === 0 || height === 0) {
        console.log('width: ' + width, 'height: ' + height);
        return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-width/2 + x,  height/2 + y - r);
    ctx.lineTo(-width/2 + x, -height/2 + y + r);

    ctx.arcTo (-width/2 + x, -height/2 + y, -width/2 + x + r, -height/2 + y, r);
    ctx.lineTo( width/2 + x - r, -height/2 + y);

    ctx.arcTo ( width/2 + x, -height/2 + y,  width/2 + x, -height/2 + y + r, r);
    ctx.lineTo( width/2 + x,  height/2 + y - r);

    ctx.arcTo ( width/2 + x,  height/2 + y,  width/2 + x - r,  height/2 + y, r);
    ctx.lineTo(-width/2 + x + r,  height/2 + y);

    ctx.arcTo (-width/2 + x,  height/2 + y, -width/2 + x,  height/2 + y - r, r);
    ctx.closePath()
    ctx.restore();

    return self;
}

light.sprite.prototype.moveTo = function(x, y, width, height, callback, movet){//不包含动画  左上角坐标点  movet s
    var self = this;

    self.moveTo_x = x;
    self.moveTo_y = y;
    if(movet){
        self.v = Math.sqrt((y-self.y)*(y-self.y)+(x-self.x)*(x-self.x))*1000/movet;
    }
    if(x == self.x){
        y > self.y ? self.angle = 90 : self.angle = 270;
        var t = (y-self.y)/self.v;
        self.resize(width, height,t,callback);
        return;
    }

    self.angle = ~~(Math.atan((y-self.y)/(x-self.x))*180/Math.PI);//13正 24负

    if(x < self.x){
        self.angle = self.angle+180;
    }
    var t = Math.sqrt((y-self.y)*(y-self.y)+(x-self.x)*(x-self.x))*1000/self.v;

    self.setAngle(self.angle);
    self.resize(width, height, t, callback);
}

light.sprite.prototype.setAngleTo = function(target){
    var self = this;

    if(target.x === self.x){
        target.y > self.y ? self.angle = 90 : self.angle = 270;
        return;
    }

    self.angle = ~~(Math.atan((target.y-self.y)/(target.x-self.x))*180/Math.PI);//13正 24负

    if(target.x < self.x){
        self.angle = self.angle+180;
    }

    self.setAngle(self.angle);

    return self;
}

light.sprite.prototype.setAngle = function(angle){
    var self = this,
    that = light;

    self.angle = angle;
    self.v  = Math.sqrt(Math.pow(self.vx, 2) + Math.pow(self.vy, 2));
    self.vx = self.v * that.cos(angle);
    self.vy = self.v * that.sin(angle);

    return self;
}

light.sprite.prototype.fade = function(time, flag, callback){   //time ms flag -1 fadeOut 1 fadeIn
    var self = this,
    that = light;

    if(callback){
        self.fadeCallback = callback.bind(self);
    }
    if(time){
        self.fadeTime = time;
    }
    if(flag){
        self.fadeFlag = flag;
        return;
    }
    if((!self.fadeTime) && (!self.fadeFlag)){
        return;
    }

    self.blinkStyle = null;

    if(self.changeOpacity == null){
        if(self.fadeFlag == -1)
            self.changeOpacity = Math.abs(self.opacity - 0);
        if(self.fadeFlag == 1)
            self.changeOpacity = Math.abs(self.opacity - 1);
    }
    
    var now = that.stNowTime;
    self.opacity = self.opacity + self.fadeFlag*(self.changeOpacity*(now - self.old)/self.fadeTime);
    if(self.opacity >= 1){
        self.opacity = 1;
        self.changeOpacity = self.opacity;
        self.fadeTime = null;
        self.fadeFlag = null;
        if(self.fadeCallback)
            self.fadeCallback();
        self.fadeCallback = null;
        return;
    }
    if(self.opacity <= 0){
        self.opacity = 0;
        self.old_opacity = self.opacity;
        self.fadeTime = null;
        self.fadeFlag = null;
        if(self.fadeCallback)
            self.fadeCallback();
        self.fadeCallback = null;
        return;
    }
}

/*
 * note     闪烁
 * author     Light
 */

light.sprite.prototype.blink = function(conf){
    var self = this,
    that = light;

    if (conf) {
        self.blinkStyle = conf.style || 'all'; // 闪烁属性，暂时只支持透明度
        self.blinkSpeed = conf.speed || 1000; // 闪烁速度
        self.blinkCount = conf.count || -1; // 闪烁次数
        self.blinkBegin = conf.blinkBegin || 1; // 起始的透明度
        self.blinkEnd   = conf.blinkEnd || 0; // 结束的透明度
        self.blinkFlag   = conf.blinkFlag || -1; // 标识  增加还是减少
        self.blinkCallback = conf.callback || function(){};
    }

    if (self.blinkStyle === 'opacity' || self.blinkStyle === 'all') {
        var changeOpacity = Math.abs(self.blinkBegin - self.blinkEnd);

        var now = that.stNowTime;
        
        self.opacity = self.opacity + self.blinkFlag*(changeOpacity*(now - self.old)/self.blinkSpeed);

        if(self.blinkBegin > self.blinkEnd){
            if (self.opacity >= self.blinkBegin) {
                self.opacity = self.blinkBegin;
                self.blinkFlag = -1 * self.blinkFlag;
                self.blinkCount -= 0.5;
            }

            if(self.opacity <= self.blinkEnd){
                self.opacity = self.blinkEnd;
                self.blinkFlag = -1 * self.blinkFlag;
                self.blinkCount -= 0.5;
            }
        } else{
            if(self.opacity >= self.blinkEnd){
                self.opacity = self.blinkEnd;
                self.blinkFlag = -1 * self.blinkFlag;
                self.blinkCount -= 0.5;
            }

            if(self.opacity <= self.blinkBegin){
                self.opacity = self.blinkBegin;
                self.blinkFlag = -1 * self.blinkFlag;
                self.blinkCount -= 0.5;
            }
        }

        if (self.blinkCount === 0) {
            self.blinkStyle = undefined;
            self.blinkCallback.bind(self);
            self.blinkCallback();
        }
    }

    return self;
}

light.sprite.prototype.resetTime = function(){
    var self = this;

    self.old = Date.now();
}

light.sprite.prototype.click = function(){//点击后发生的事件

}

light.sprite.prototype.isOnSprite = function(x, y){
    var self = this;

    if(x >= self.x && x <= self.x+self.width && y >= self.y && y <= self.y+self.height){
        return true;
    }
    return false
}

light.sprite.prototype.reviseAngle = function(){//将速度角度限定为0-360度
    var self = this;

    for(var i = 1; self.angle >= 360; i++){
        self.angle = self.angle - 360;
    }

    for(var i = 1; self.angle < 0; i++){
        self.angle = self.angle + 360;
    }
}

light.sprite.prototype.resize = function(width, height, time, callback){
    var self = this,
    that = light;

    if(callback){
        self.changeSizeCallback = callback;
    }
    if(width){
        self.oldWidth = self.width;
        self.changeWidth = width - self.width;
    }
    if(height){
        self.oldHeight = self.height;
        self.changeHeight = height - self.height;
    }
    if(time){
        self.changeTime = time;
        return;
    }
    if((!self.changeTime) || (!self.changeHeight) || (!self.changeWidth)){
        return;
    }

    var now = that.stNowTime;

    self.width = self.width + (self.changeWidth/self.changeTime*(now - self.old));
    self.height = self.height + (self.changeHeight/self.changeTime*(now - self.old));

    if( (Math.abs(self.width - self.oldWidth) > Math.abs(self.changeWidth)) || (Math.abs(self.height - self.oldHeight) > Math.abs(self.changeHeight))){
        self.width = self.oldWidth + self.changeWidth;
        self.height = self.oldHeight + self.changeHeight;

        self.oldWidth = null;
        self.oldHeight = null;
        self.changeTime = null;
        self.changeWidth = null;
        self.changeHeight = null;

        if(self.changeSizeCallback)
            self.changeSizeCallback();
        self.changeSizeCallback = null;
        return;
    }
}

light.sprite.prototype.isDestination = function(){//判断是否到达目的地  不含旋转角度
    var self = this;

    if(self.moveTo_x != null && self.moveTo_y != null){
        var x = ~~self.x,
        y = ~~self.y;
        self.reviseAngle();
        if(self.angle >= 0 && self.angle < Math.PI/2){//速度方向在第一象限
            if(self.moveTo_x <= x && self.moveTo_y <= y){
                self.x = self.moveTo_x;
                self.y = self.moveTo_y;

                self.moveTo_x = null;
                self.moveTo_y = null;
                self.v = 0;
                self.angle = 0;
                return;
            }
        }
        if(self.angle >= Math.PI/2 && self.angle < Math.PI){//速度方向在第二象限
            if(self.moveTo_x >= x && self.moveTo_y <= y){
                self.x = self.moveTo_x;
                self.y = self.moveTo_y;

                self.moveTo_x = null;
                self.moveTo_y = null;
                self.v = 0;
                self.angle = 0;
                return;
            }
        }
        if(self.angle >= Math.PI && self.angle < Math.PI*3/2){//速度方向在第三象限
            if(self.moveTo_x >= x && self.moveTo_y >= y){
                self.x = self.moveTo_x;
                self.y = self.moveTo_y;

                self.moveTo_x = null;
                self.moveTo_y = null;
                self.v = 0;
                self.angle = 0;
                return;
            }
        }
        if(self.angle >= Math.PI*3/2 && self.angle < Math.PI*2){//速度方向在第四象限
            if(self.moveTo_x <= x && self.moveTo_y >= y){
                self.x = self.moveTo_x;
                self.y = self.moveTo_y;

                self.moveTo_x = null;
                self.moveTo_y = null;
                self.v = 0;
                self.angle = 0;
                return;
            }
        }
    }
}

light.sprite.prototype.isRotateToAngle = function(){//旋转角度限定
    var self = this;

    if(self.rotateAngle !== null){
        if(self.w > 0){
            if(self.rotate >= self.rotateAngle){
                self.rotate = self.rotateAngle;
                self.w = 0;

                if (self.rotateAngleCallBack){
                    self.rotateAngle = null;
                    self.rotateAngleCallBack.call(self);
                }
            }
        }
        if(self.w < 0){
            if(self.rotate <= self.rotateAngle){
                self.rotate = self.rotateAngle;
                self.w = 0;
                
                if (self.rotateAngleCallBack){
                    self.rotateAngle = null;
                    self.rotateAngleCallBack.call(self);
                }
            }
        }
    }
}

light.sprite.prototype.rotateToAngle = function(angle, w){
    var self = this,
    w = w || 500;

    self.rotate = self.rotate % 360;
    if (self.rotate < 0) {
        self.rotate += 360;
    }

    angle = angle % 360;
    if (angle < 0) {
        angle += 360;
    }

    var gap = angle - self.rotate;

    if (gap > -180 && gap < 0) {
        w = -w;
    }else if (gap > 180) {
        self.rotate += 360;
        w = -w;
    } else if (gap < -180) {
        angle += 360;
    }

    self.rotateAngle = angle;
    self.w = w;
}

light.sprite.prototype.changeAnim = function(name){
    var self = this,
    that = light,
    name = name || 'Default';

    self.curAnimation = name;
    self.curFrame = 0;
    self.frameStart = that.stNowTime;
}

light.sprite.prototype.createAnim = function(anim){
    var self = this,
    animobj = {},
    length = anim.frames.length,
    inputType = typeof(anim.frames[0]);

    animobj.name = anim.name || 'Default';
    animobj.speed = +anim.speed || 100;//动画播放速度  ms
    animobj.loop = anim.loop || -1; // 循环次数 -1为无限次
    animobj.callback = anim.callback;
    animobj.frames = [];

    for(var i = 0; i < length; i++){
        if (inputType === 'string') {
            var tempImg = new Image();

            tempImg.onload = function(){
                if (!self.width) {
                    self.width = tempImg.width;
                }

                if (!self.height) {
                    self.height = tempImg.height;
                }
            }

            tempImg.src = anim.frames[i];
            animobj.frames.push(tempImg);//存入图片对象
        } else if(inputType === 'function'){
            animobj.frames.push(anim.frames[i]);//存入绘制
        }
    }

    var anim = self.getanimByName(animobj.name);//返回的依然是引用类型

    if(anim){
        anim = animobj;
    }
    else{
        self.animations.push(animobj);//对象压入数组
    }

    return self;
}

light.sprite.prototype.getanimByName = function(name){
    var self = this,
    anims = self.animations,
    length = anims.length;

    for(var i = 0; i < length; i++){
        if(anims[i].name === name){
            return anims[i];
        }
    }
    return null;
}

light.sprite.prototype.runAnimation = function(anim){
    var self = this,
    that = light,
    now = that.stNowTime,//ms  当前时间
    typeFrame = typeof(anim.frames[self.curFrame]),
    gap = (now - self.old)/1000;

    if (that.pauseSprite && !self.noPause) {
        self.old = now;
        if (typeFrame === 'function') {
            self.draw(anim.frames[self.curFrame].bind(self));
        } else{
            self.draw(anim.frames[self.curFrame]);//绘制
        }
        return;
    }

    if (self.customPath) {
        self.customPath();
    }
    self.vx += self.ax*gap;
    self.vy += self.ay*gap;
    
    if (!self.lockVx) {
        self.x += self.vx*gap;
    }
    if (!self.lockVy) {
        self.y += self.vy*gap;
    }

    self.isDestination();
    self.isRotateToAngle();
    self.fade();
    self.blink();
    self.resize();
    self.rotate += self.w*gap;
    if (typeFrame === 'function') {
        self.draw(anim.frames[self.curFrame].bind(self));
    } else{
        self.draw(anim.frames[self.curFrame]);//绘制
    }
    self.old = now;

    if(now >= self.frameStart + anim.speed){
        self.frameStart = now;
        self.curFrame++;

        if(self.curFrame >= anim.frames.length){
            self.curFrame = 0;
            if (anim.callback) {
                anim.callback.call(self);
            }
        }
    }
}

light.sprite.prototype.run = function(){
    var self = this,
    anim = null;

    if (self.noLayer) {
        self.old = light.stNowTime;
        return;
    }

    anim = self.getanimByName(self.curAnimation);
    self.runAnimation(anim);
}

//--------------------------------------------//
//                    水纹                    //
//--------------------------------------------//
//振幅计算   水纹扩散
light.waterModel.prototype.amplitude = function(){

    var self = this,
    swapMap = null,
    val = null,
    x = 0,
    y = 0;

    if (!self.evolving) {
        return;
    }

    self.evolving  = false;

    for (x = 1; x <= self.width; x++) {
        for (y = 1; y <= self.height; y++) {

            // Handle borders correctly
            val = self.amplitudeMap1[x - 1][y] + self.amplitudeMap1[x + 1][y] + self.amplitudeMap1[x][y - 1] + self.amplitudeMap1[x][y + 1];

            // Damping
            val = ((val / 2.0) - self.amplitudeMap2[x][y]) * self.damping;
            
            // Clipping prevention
            if (Math.abs(val) <= self.evolveThreshold){
                self.amplitudeMap2[x][y] = 0.0;
                continue;
            } else if (val>self.clipping) {
                val = self.clipping;
            } else if(val<-self.clipping) {
                val = -self.clipping;
            }
            
            // Evolve check
            self.evolving = true;
            
            self.amplitudeMap2[x][y] = val;
        }
    }

    // Swap buffer references
    swapMap     = self.amplitudeMap1;
    self.amplitudeMap1     = self.amplitudeMap2;
    self.amplitudeMap2     = swapMap;

}

//渲染整个水池
light.waterModel.prototype.drawWaterPool = function(){
    var self = this;

    if (!self.evolving) {
        return;
    }
    var imgDataOut = self.context2D.getImageData(0, 0, self.width, self.height),
    pixelsOut = imgDataOut.data,
    pixel = null,
    x = 0,
    y = 0,
    strength = 0,
    refraction = 0,
    xPix = 0,
    yPix = 0,
    n = pixelsOut.length;

    for (var i = 0; i < n; i += 4) {
        pixel = i/4;
        x = pixel % self.width;
        y = (pixel-x) / self.width;
        
        strength = self.amplitudeMap1[x+1][y+1];
        if (strength === 0) {
            continue;
        }
        
        // Refraction of light in water
        refraction = Math.round(strength * self.lightRefraction);
        
        if (x <= self.width/2 && y <= self.width/2) {
            xPix = x - refraction;
            yPix = y - refraction;
        } else if(x >= self.width/2 && y <= self.width/2){
            xPix = x + refraction;
            yPix = y - refraction;
        } else if(x >= self.width/2 && y >= self.width/2){
            xPix = x + refraction;
            yPix = y + refraction;
        } else if(x <= self.width/2 && y >= self.width/2){
            xPix = x - refraction;
            yPix = y + refraction;
        }
        
        if(xPix < 0) xPix = 0;
        if(yPix < 0) yPix = 0;                    
        if(xPix > self.width-1) xPix = self.width-1;
        if(yPix > self.height-1) yPix = self.height-1;            
        
        
        
        // Get the pixel from input
        var iPix = ((yPix * self.width) + xPix) * 4;
        var red     = self.pixelsIn[iPix  ];
        var green     = self.pixelsIn[iPix+1];
        var blue     = self.pixelsIn[iPix+2];
        
        
        // Set the pixel to output
        strength *= self.lightReflection;
        strength += 1.0;

        pixelsOut[i  ] = red *= strength;
        pixelsOut[i+1] = green *= strength;
        pixelsOut[i+2] = blue *= strength;
        //pixelsOut[i+3] = 255; 
    }

    self.context2D.putImageData(imgDataOut, 0,0);

}

//
light.waterModel.prototype.run = function(){
    var self = this;
    
    self.amplitude();
    self.drawWaterPool();
}

/*
 * note 触碰水面
 * touch point点击, touch 滑动, rain 下雨
 */
light.waterModel.prototype.touchWater = function(x,y,touch){

    var self = this,
    arrayTouch = self[touch],
    lx = arrayTouch.length,
    ly = arrayTouch[0].length;

    self.evolving = true;

    for(var i = 0; i < lx; i++){
        for(var j = 0; j < ly; j++){
            if (x+i >= 0 && y+j >=0  && x+i < self.width && y+j < self.height) {
                self.amplitudeMap1[x+1+i][y+1+j] -= arrayTouch[i][j];
            }
        }
    }
}

light.waterModel.prototype.rain = function(){
    var self = this,
    x = Math.round(Math.random()*self.width),
    y = Math.round(Math.random()*30+10),
    x2 = Math.round(Math.random()*self.width),
    y2 = Math.round(Math.random()*30+10),
    swich = Math.random();

    if (swich < 0.3) {
        return;
    }

    if (swich > 0.7) {
        self.touchWater(x2,y2,'rainWaterArray');
    }

    self.touchWater(x,y,'rainWaterArray');
}

//--------------------------------------------//
//                    雪花                    //
//--------------------------------------------//
// 初始化雪花数组
light.snowModel.prototype.initFlakeArr = function(){
    var self = this;
    for(var i = 0; i < self.flakeNum; i++){
        self.flakeArr.push(self.initFlake());
    }
}
// 初始化雪花
light.snowModel.prototype.initFlake = function(sf){
    var self = this;

    return {
        x: Math.random()*self.width,
        y: Math.random()*self.height,
        r: Math.random()*self.r + 1,
        color: 'rgba(255, 255, 255, '+(Math.random()*(self.opacityMax - self.opacityMin) + self.opacityMin)+')',
        density: Math.random()*self.flakeNum,
        windX : 0,
        windY : 0,
        angle : sf && sf.angle || Math.random()*Math.PI*2
    }
}

light.snowModel.prototype.draw = function(){
    var self = this;

    self.context2D.clearRect(0, 0, self.width, self.height);
    self.context2D.fillStyle = self.bgColor;
    self.context2D.fillRect(0, 0, self.width, self.height);

    for(var i = 0; i < self.flakeNum; i++){
        var sf = self.flakeArr[i];
        self.context2D.beginPath();
        self.context2D.fillStyle = sf.color;
        self.context2D.moveTo(sf.x, sf.y);
        self.context2D.arc(sf.x, sf.y, sf.r, 0, Math.PI*2, true);
        self.context2D.fill();
    }
    self.context2D.fillStyle = '#000';
    self.context2D.fillRect(wid/2 - 100,hig/2 - 60,200,5);
}
// 雪花飘落
light.snowModel.prototype.snowDown = function(){
    var self = this,
    windArea = [];

    //
    for(var i = 0; i < self.windArea.length; i++){
        if (self.windArea[i].windNum <= 0) {
            self.windArea.splice(i,0);
        }else{
            self.windArea[i].windNum --;
            windArea.push(self.windArea[i]);
        }                        
    }

    for(var i = 0; i < self.flakeNum; i++){
        var sf = self.flakeArr[i];

        self.windEffect(windArea, sf);

        sf.angle += 0.01;
        sf.y += 0.8*(Math.cos(sf.angle + sf.density) + 1 + sf.r/2)*self.vk + sf.windY;
        sf.x += 0.3*Math.cos(sf.angle)*2*self.vk + sf.windX;

        self.snowsCover(sf);

        if (sf.windX > 0.01) {
            //sf.windX -= 0.01;
            sf.windX *= self.windDamp;
        } else if(sf.windX < -0.01){
            //sf.windX += 0.01;
            sf.windX *= self.windDamp;
        } else{
            sf.windX = 0;
        }

        if (sf.windY > 0.01) {
            //sf.windY -= 0.01;
            sf.windY *= self.windDamp;
        } else if(sf.windY < -0.01){
            //sf.windY += 0.01;
            sf.windY *= self.windDamp;
        } else{
            sf.windY = 0;
        }

        if (sf.y > self.height + 2*self.r || sf.x > self.width + 2*self.r || sf.x < - 2*self.r) {
            if (i % 5 > 0) {
                sf = self.flakeArr[i] = self.initFlake(sf);
                sf.y = -2*self.r - 2;
            } else{
                if ( (sf.angle + sf.density) % (2*Math.PI) < Math.PI) {
                    sf = self.flakeArr[i] = self.initFlake(sf);
                    sf.x = -2*self.r;
                } else{
                    sf = self.flakeArr[i] = self.initFlake(sf);
                    sf.x = self.width + 2*self.r;
                }
            }
        }
    }
}

/*
 * note 风区域
 * l1, l2, l3, l4 4条线方程
 * dir方向  {x:-1,y:1}
 */
light.snowModel.prototype.windArea = [];

light.snowModel.prototype.addWind = function(p1, p2, p3, p4){
    var self = this,
    l1 = p1.A ? p1 : light.getLineFunction(p1,p2),
    l2 = p2.A ? p2 : light.getLineFunction(p2,p3),
    l3 = p3.A ? p3 : light.getLineFunction(p3,p4),
    l4 = p4.A ? p4 : light.getLineFunction(p4,p1),
    dir = {},
    pp1 = light.getLinePoint(l1, l4),
    pp2 = light.getLinePoint(l1, l2);

    if (pp1 === null) {
        console.log(l1, l4, p1, p2, p4);
    }
    // 逆向
    if ( pp1.x < pp2.x ) {
        dir.x = 1;
    } else{
        dir.x = -1;
    }

    if ( pp1.y < pp2.y ) {
        dir.y = 1;
    } else{
        dir.y = -1;
    }

    self.windArea.push({
        'l1' : l1,
        'l2' : l2,
        'l3' : l3,
        'l4' : l4,
        'dir' : dir,
        'A2': Math.abs(l1.A)/Math.sqrt(1+l1.A*l1.A),
        'B2': 1/Math.sqrt(1+l1.A*l1.A),
        'windNum' : 5
    });
}

light.snowModel.prototype.windEffect = function(windArea, p){
    var self = this,
    length = windArea.length,
    sum = 0;

    for(var i = 0; i < length; i++){
        if (light.inRectangle(undefined, p, windArea[i])) {
            p.windX += self.windPower * windArea[i].B2 * windArea[i].dir.x / p.r;
            p.windY += self.windPower * windArea[i].A2 * windArea[i].dir.y / p.r;
        }
    }
}

light.snowModel.prototype.run = function(){
    var self = this;

    self.snowDown();
    self.draw();
}

light.snowModel.prototype.snowsCover = function(sf){
    var self = this;

    if (self.snowsCoverData === null) {
        return;
    }

    var px = light.getPixel(self.snowsCoverData, sf.x, sf.y + sf.r);
    if (px.r === 0 && px.g === 0 && px.b === 0) {
        sf.y = self.height+200;
    }
}

//----------------------------------------------//
//                    计时器                    //
//----------------------------------------------//

light.clock.prototype.doSomething = function(){
    //等待用户自定义
}

light.clock.prototype.run = function(){
    var self = this,
    that = light;

    if (!self.noPause && that.pauseSprite) {
        self.start = that.stNowTime;
        return;
    }

    if(self.loop === 0){
        self.destory = true;
        that.stDestoryClock = true;
        return;
    }

    if(that.stNowTime - self.start >= self.gap){
        self.loop--;
        self.start = that.stNowTime;
        self.doSomething();
    }
}

/*获取鼠标位置*/
function mousePosition(ev){ 
    if(ev.pageX || ev.pageY){ 
        return {x:ev.pageX, y:ev.pageY}; 
    } 
    return {
        x:ev.clientX + document.body.scrollLeft - document.body.clientLeft, 
        y:ev.clientY + document.body.scrollTop - document.body.clientTop 
    }; 
}

/*获取点击位置*/
function touchPosition(ev){ 
    if (ev.touches.length > 0) {
        return {
            x : ev.touches[0].pageX, 
            y : ev.touches[0].pageY
        }; 
    } else{
        return {
            x : ev.changedTouches[0].pageX, 
            y : ev.changedTouches[0].pageY
        }; 
    }
    
}


//canvas
window.requestAnimFrame = (function() {
                return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                    window.setTimeout(callback, 1000/60);
                };
            })();
