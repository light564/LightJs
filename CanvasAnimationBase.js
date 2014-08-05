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

/*
*	t 时间    f   定时函数
*/
function RunFunctionTiming(t, f){
	requestAnimFrame(function(){
		var timing = window.timing;
		if(timing == undefined){
			return;
		}
    	var gap = (Date.now() - timing)/1000;
		if(gap > t){
			timing = Date.now();
			f();
		}
		else{
			RunFunctionTiming(t, f);//一直执行到时间满足条件
		}
    });
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

function GetNowTime(){//返回单位为s
	var start_time = window.start_time;
	if(!start_time){
		return;
	}
	return ((Date.now() - start_time)/1000.0);
}
/*
*	img  图片对象，已经加载完的
*	x,y  图片左上角坐标
*	img_width，img_height 绘制图片的宽度 高度
*	rotate	图片旋转的角度
*/
function DrawImg(_img, x, y, img_width, img_height, rotate, opacity, center_x, center_y){
	var context2D = window.context2D;
	if(!context2D){
		return;
	}
	if(!rotate){
		rotate = 0;
	}
	if(!img_width){
		img_width = _img.width;
	}

	if(!img_height){
		img_height = _img.height;
	}
	if(opacity == null){
		opacity = 1;
	}
	if(!center_x){
		center_x = x+img_width/2;
	}
	if(!center_y){
		center_y = y+img_height/2;
	}
	
	context2D.translate(center_x, center_y);
	context2D.rotate(rotate);
	context2D.globalAlpha = opacity;
	context2D.drawImage(_img, x - center_x, y - center_y, img_width, img_height);
	context2D.rotate(-rotate);
	context2D.translate(-center_x, -center_y);
	context2D.globalAlpha = 1;
}

/*  
*	若未初始化宽度 则为0
*/
function Sprite(){
	if (!(this instanceof Sprite)){//强制使用new
		return new Sprite();
	}

	this.name = "Sprite";
	this.src  = "";
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
	this.rotate = 0;
	this.opacity = 1;//透明度
	this.change_opacity = null;
	this.hotpot = false;//鼠标热点  true后鼠标为手型

	/*元素动作*/
	this.v = 0;//移动速度  s
	this.angle = 0;//移动方向  s
	this.w = 0;//旋转角速度  s

	/*元素范围限定*/
	this.moveTo_x = null;
	this.moveTo_y = null;
	this.rotate_angle = null;

	/*fadein and fadeout*/
	this.fadeTime = null;
	this.fadeFlag = null;
	this.fadecallback = null;

	/*改变大小*/
	this.old_width = null;
	this.old_height = null;
	this.changeTime = null;
	this.change_width = null;
	this.change_height = null;
	this.changesize_callback = null;

	/*旋转中心*/
	this.rotate_centerX = null;
	this.rotate_centerY = null;

	this.animations = new Array();
	this.curAnimation = "Default";//当前播放的用户名
	this.curFrame = 0;//当前显示的图片序号
	this.frameStart = GetNowTime();//一帧动画开始的时间（结束后刷新）
	this.old = GetNowTime();//移动前的时间

	this.destoryOutside = false;
	this.destory = false;
}

Sprite.prototype.draw = function(_img, x, y, img_width, img_height, rotate, opacity){
	if(!(x && y)){
		x = this.x;
		y = this.y;
	}
	if(!rotate){
		rotate = this.rotate;
	}
	if(!img_width){
		img_width = this.width;
	}
	if(!img_height){
		img_height = this.height;
	}
	if(opacity == null){
		opacity = this.opacity;
	}
	DrawImg(_img, x, y, img_width, img_height, rotate, opacity, this.rotate_centerX, this.rotate_centerY);
}

Sprite.prototype.moveTo = function(x, y, width, height, callback, movet){//不包含动画  左上角坐标点  movet s
	this.moveTo_x = x;
	this.moveTo_y = y;
	if(movet){
		this.v = Math.sqrt((y-this.y)*(y-this.y)+(x-this.x)*(x-this.x))/movet;
	}
	if(x == this.x){
		y > this.y ? this.angle = Math.PI/2 : this.angle = Math.PI*3/2;
		var t = (y-this.y)/this.v;
		this.Resize(width, height,t,callback);
		return;
	}

	this.angle = Math.atan((y-this.y)/(x-this.x));//13正 24负

	if(x < this.x){
		this.angle = this.angle+Math.PI;
	}
	var t = Math.sqrt((y-this.y)*(y-this.y)+(x-this.x)*(x-this.x))/this.v;
	this.Resize(width, height, t, callback);
}

Sprite.prototype.rotateAngle = function(a){
	this.rotate_angle = a;
}

Sprite.prototype.Fade = function(time, flag, callback){//time s flag -1 fadeOut 1 fadeIn
	if(callback){
		this.fadecallback = callback;
	}
	if(time){
		this.fadeTime = time;
	}
	if(flag){
		this.fadeFlag = flag;
		return;
	}
	if((!this.fadeTime) && (!this.fadeFlag)){
		return;
	}

	if(this.change_opacity == null){
		if(this.fadeFlag == -1)
			this.change_opacity = Math.abs(this.opacity - 0);
		if(this.fadeFlag == 1)
			this.change_opacity = Math.abs(this.opacity - 1);
	}
	var now = GetNowTime();
	this.opacity = this.opacity + this.fadeFlag*(this.change_opacity/this.fadeTime*(now - this.old));
	if(this.opacity > 1){
		this.opacity = 1;
		this.change_opacity = this.opacity;
		this.fadeTime = null;
		this.fadeFlag = null;
		if(this.fadecallback)
			this.fadecallback();
		return;
	}
	if(this.opacity < 0){
		this.opacity = 0;
		this.old_opacity = this.opacity;
		this.fadeTime = null;
		this.fadeFlag = null;
		if(this.fadecallback)
			this.fadecallback();
		this.fadecallback = null;
		return;
	}
}

Sprite.prototype.click = function(){//点击后发生的事件

}

Sprite.prototype.IsOnSprite = function(x, y){
	if(x > this.x && x < this.x+this.width && y > this.y && y < this.y+this.height){
		return true;
	}
	return false
}

Sprite.prototype.ReviseAngle = function(){//将速度角度限定为0-360度
	for(var i = 1; this.angle >= Math.PI*2; i++){
		this.angle = this.angle - Math.PI*2*i;
		
	}
	for(var i = 1; this.angle < 0; i++){
		this.angle = this.angle + Math.PI*2*i;
	}
}

Sprite.prototype.Resize = function(width, height, time, callback){
	if(callback){
		this.changesize_callback = callback;
	}
	if(width){
		this.old_width = this.width;
		this.change_width = width - this.width;
	}
	if(height){
		this.old_height = this.height;
		this.change_height = height - this.height;
	}
	if(time){
		this.changeTime = time;
		return;
	}
	if((!this.changeTime) && (!this.change_height) && (!this.change_width)){
		return;
	}
	var now = GetNowTime();
	this.width = this.width + (this.change_width/this.changeTime*(now - this.old));
	this.height = this.height + (this.change_height/this.changeTime*(now - this.old));

	if( (Math.abs(this.width - this.old_width) > Math.abs(this.change_width)) || (Math.abs(this.height - this.old_height) > Math.abs(this.change_height))){
		this.old_width = null;
		this.old_height = null;
		this.changeTime = null;
		this.change_width = null;
		this.change_height = null;

		if(this.changesize_callback)
			this.changesize_callback();
		this.changesize_callback = null;
		return;
	}
}

Sprite.prototype.IsDestination = function(){//判断是否到达目的地  不含旋转角度
	if(this.moveTo_x != null && this.moveTo_y != null){
		this.ReviseAngle();
		if(this.angle >= 0 && this.angle < Math.PI/2){//速度方向在第一象限
			if(this.moveTo_x <= this.x && this.moveTo_y <= this.y+1e-13){
				this.x = this.moveTo_x;
				this.y = this.moveTo_y;

				this.moveTo_x = null;
				this.moveTo_y = null;
				this.v = 0;
				this.angle = 0;
			}
		}
		if(this.angle >= Math.PI/2 && this.angle < Math.PI){//速度方向在第二象限
			if(this.moveTo_x >= this.x && this.moveTo_y <= this.y+1e-13){
				this.x = this.moveTo_x;
				this.y = this.moveTo_y;

				this.moveTo_x = null;
				this.moveTo_y = null;
				this.v = 0;
				this.angle = 0;
			}
		}
		if(this.angle >= Math.PI && this.angle < Math.PI*3/2){//速度方向在第三象限
			if(this.moveTo_x >= this.x && this.moveTo_y+1e-13 >= this.y){
				this.x = this.moveTo_x;
				this.y = this.moveTo_y;

				this.moveTo_x = null;
				this.moveTo_y = null;
				this.v = 0;
				this.angle = 0;
			}
		}
		if(this.angle >= Math.PI*3/2 && this.angle < Math.PI*2){//速度方向在第四象限
			if(this.moveTo_x <= this.x && this.moveTo_y+1e-13 >= this.y){
				this.x = this.moveTo_x;
				this.y = this.moveTo_y;

				this.moveTo_x = null;
				this.moveTo_y = null;
				this.v = 0;
				this.angle = 0;
			}
		}
	}
}

Sprite.prototype.IsRotateToAngle = function(){//旋转角度限定
	if(this.rotate_angle != null){
		if(this.w > 0){
			if(this.rotate >= this.rotate_angle){
				this.rotate = this.rotate_angle;
				this.w = 0;
			}
		}
		if(this.w < 0){
			if(this.rotate <= this.rotate_angle){
				this.rotate = this.rotate_angle;
				this.w = 0;
			}
		}
	}
}

Sprite.prototype.CreateAnim = function(anim){
	var animobj = new Object();
	animobj.name = anim.name || "Default";
	animobj.speed = anim.speed || 10;//动画播放速度  s
	animobj.frames = new Array();
	anim.frames.forEach(function(element){
		var tempImg = new Image();
		tempImg.src = element;
		animobj.frames.push(tempImg);//存入图片对象
	});
	var anim = this.GetanimByName(animobj.name);//返回的依然是引用类型
	if(anim){
		anim = animobj;
	}
	else{
		this.animations.push(animobj);//对象压入数组
	}
}

Sprite.prototype.RunanimByName = function(name){
	var anim = this.GetanimByName(name);
	anim != null ? this.RunAnimation(anim) :  this.RunAnimation(this.GetanimByName("Default"));
}

Sprite.prototype.GetanimByName = function(name){
	var anims = this.animations;
	var length = anims.length
	for(var i = 0; i < length; i++){
		if(anims[i].name == name){
			return anims[i];
		}
	}
	return null;
}

Sprite.prototype.RunAnimation = function(anim){
	var animobj = anim;
	var cur_frame_gap = 1/animobj.speed;//s
	var now = GetNowTime();//s  当前时间

	var img_src = animobj.frames[this.curFrame];
	
	this.x = this.x + this.v*(now - this.old)*Math.cos(this.angle);
	this.y = this.y + this.v*(now - this.old)*Math.sin(this.angle);
	this.IsDestination();
	this.IsRotateToAngle();
	this.Fade();
	this.Resize();
	this.rotate = this.rotate + this.w*(now - this.old);
	this.draw(img_src);//绘制
	this.old = now;

	if(now >= this.frameStart + cur_frame_gap){
		this.frameStart = GetNowTime();
		this.curFrame++;
		if(this.curFrame >= animobj.frames.length){
			this.curFrame = 0;
		}
	}
}


/*
*	Sprite生成器
*/
function Builder(){
	if (!this instanceof Builder){//强制使用new
		return new Builder();
	}
	this.name = "Builder";//生成元素的名字
	this.gap = null;//生成器生成间隔
	this.num = 0;//生成器一次生成数量
	this.startTime = GetNowTime();//生成元素计时
	this.weight = 0;//运行一次生成概率
	/*生成器生成元素位置范围*/
	this.area = new Object();

	/*
	*生成器生成元素  运动数值范围
	*/
	this.v = {
		min : 0,
		max : 0
	}

	this.angle = {
		min : 0,
		max : 0,
	}

	this.w = {
		min : 0,
		max : 0
	}
	/*可大可小*/
	this.width = {
		min : 0,
		max : 0
	}

	this.height = {
		min : 0,
		max : 0
	}
}

Builder.prototype.AddArea = function(area){
	if(!area.x){
		area.x.min = 0;
		area.x.max = 0;
	}
	if(!area.y){
		area.y.min = 0;
		area.y.max = 0;
	}
	this.area = area;
}

/*给生成元素增加其它属性*/
Builder.prototype.AddProperty = function(){

}

/*生成Sprite
*	传入anim  控制生成图像
*	暂时创建出的元素仅一组动画  每组权值均等
*/

Builder.prototype.CreateSprite = function(anim_list, layern, layer){//传入动画List  每个元素为一组动画 不同组是不同的动画   
	if(!this.area){
		console.log("no area!");
		return null;
	}
	if(!anim_list || anim_list.length <= 0){
		anim_list = this.anim_list;
	}
	var now = GetNowTime();
	if(now - this.startTime >= this.gap){
		this.startTime = now;
	}
	else{
		return;
	}

	var build_list = new Array();
	var NewSprite = new Sprite();

	for(var i = 0; i < this.num; i++){
		if(Math.random() < this.weight){
			build_list = new Array();
			NewSprite = new Sprite();
			NewSprite.name = this.name;
			NewSprite.x = this.area.x.min + Math.random()*(this.area.x.max - this.area.x.min);
			NewSprite.y = this.area.y.min + Math.random()*(this.area.y.max - this.area.y.min);
			NewSprite.width = this.width.min + Math.random()*(this.width.max - this.width.min);
			NewSprite.height = this.height.min + Math.random()*(this.height.max - this.height.min);
			NewSprite.v = this.v.min + Math.random()*(this.v.max - this.v.min);
			this.AddProperty();
			NewSprite.CreateAnim(anim_list[parseInt(Math.random()*anim_list.length)]);
			NewSprite.destoryOutside = this.destoryOutside;
			layer["layer" + layern].push(NewSprite);
		}
	}
}

/*
{
	fontsize:字体大小
	font:字体
	fontX:摆放字体坐标x
	fontY:摆放字体坐标y
	fontGap:字体间距
	str:字体内容   二维数组   
	color:字体颜色
	x:矩形起始x
	y:矩形起始y
	width:矩形宽度
	height:矩形高度
}
*/
function TextBox(){
	if (!(this instanceof TextBox)){//强制使用new
		return new TextBox();
	}
	this.name = "TextBox";
	this.fontsize = "15px";
	this.font = "Georgia";
	this.color = "#000000";
	this.fontGap = 0;
	this.fontX = 0;
	this.fontY = -100;
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
	this.str = null;
	this.destory = false;

	this.Start = GetNowTime();
	this.old = GetNowTime();

	this.opacity = 1;
	this.change_opacity = null;

	this.fadeTime = null;
	this.fadeFlag = null;
	this.fadecallback = null;
}

TextBox.prototype.Fade = function(time, flag, callback){//time s flag -1 fadeOut 1 fadeIn
	if(callback){
		this.fadecallback = callback;
	}
	if(time){
		this.fadeTime = time;
	}
	if(flag){
		this.fadeFlag = flag;
		return;
	}
	if((!this.fadeTime) && (!this.fadeFlag)){
		return;
	}

	if(this.change_opacity == null){
		if(this.fadeFlag == -1)
			this.change_opacity = Math.abs(this.opacity - 0);
		if(this.fadeFlag == 1)
			this.change_opacity = Math.abs(this.opacity - 1);
	}
	var now = GetNowTime();
	this.opacity = this.opacity + this.fadeFlag*(this.change_opacity/this.fadeTime*(now - this.old));
	if(this.opacity > 1){
		this.opacity = 1;
		this.change_opacity = this.opacity;
		this.fadeTime = null;
		this.fadeFlag = null;
		if(this.fadecallback)
			this.fadecallback();
		return;
	}
	if(this.opacity < 0){
		this.opacity = 0;
		this.old_opacity = this.opacity;
		this.fadeTime = null;
		this.fadeFlag = null;
		if(this.fadecallback)
			this.fadecallback();
		this.fadecallback = null;
		return;
	}
}

TextBox.prototype.draw = function(){
	context2D.font = this.fontsize + " " + this.font;
	var boxwidth = this.width;
	var text_arr = new Array();
	var temp = "";
	var str = "";
	if(!this.str || this.str.length <= 0){
		return;
	}
	for(var j = 0; j < this.str.length; j++){
		for(var i = 0; i < this.str[j].length; i++){//换行
			temp = temp + this.str[j][i];
			if(context2D.measureText(temp).width <= boxwidth){
				str = temp;
			}
			else{
				text_arr.push(str);
				temp = "";
				str = "";
				i--;
			}
		}
		if(str.length > 0){
			text_arr.push(str);
			temp = "";
			str = "";
		}
	}
	var gradient = context2D.createLinearGradient(this.x, this.y, this.x, this.y+this.height);
	gradient.addColorStop(0, "rgba(255,255,255,0)");
	gradient.addColorStop( 5/this.height, this.color);
	gradient.addColorStop( (this.height-5)/this.height, this.color);
	gradient.addColorStop( 1, "rgba(255,255,255,0)");
	context2D.fillStyle = gradient;
	context2D.globalAlpha = this.opacity;
	for(var i = 0 ; i < text_arr.length; i++){
		context2D.fillText(text_arr[i], this.fontX, this.fontY+parseInt(this.fontsize)+(parseInt(this.fontsize) + this.fontGap)*i);
	}
	context2D.globalAlpha = 1;
}

TextBox.prototype.RunanimByName = function(name){
	var context2D = window.context2D;
	if(!context2D){
		return;
	}

	var now = GetNowTime();
	
	this.Fade();
	this.draw();
	this.old = now;
}

function Clock(){
	if (!(this instanceof Clock)){//强制使用new
		return new Clock();
	}
	this.gap = 1;//计时器间隔时间 单位s
	this.loop = -1//-1为无限次循环   循环次数
	this.Start = GetNowTime();//计时器开始时间
	this.destory = false;//次数用尽后自毁
}

Clock.prototype.doSometing = function(){
	//等待用户自定义
}

Clock.prototype.Run = function(){
	if(this.loop == 0){
		this.destory = true;
		return;
	}

	var now = GetNowTime();
	if(now - this.Start>= this.gap){
		this.doSometing();
		this.Start = now;
		this.loop--;
	}
}