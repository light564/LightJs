window.light = {

	// new后的Model push到后面，统一调度
	modelStack : [],
	// new后的clock
	clockStack : [],
				
	isObject : function(obj){
		return obj === Object(obj);
	},

	isUndefined : function(obj){
		return obj === void 0;
	},

	isString :function(obj){
		return Object.prototype.toString.call(obj) == '[object String]';
	},

	isEmail: function(email){
		if (email.match('@') === null) {
			return false;
		}
		return true;
	},

	isMobilePhone: function(phone){
		if (phone.match(/(?:\(?[0\+]?\d{1,3}\)?)[\s-]?(?:0|\d{1,4})[\s-]?(?:(?:13\d{9})|(?:\d{7,8}))/) === null) {
			return false;
		}
		return true;
	},

	//遍历整个对象 找到属性值
	getObjectValue : function(obj, key){
		var self = this,
		value = null;

		if (self.isString(obj)) {
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
			
			childSelector = templateNode.attr('tmp-each-item');
			var valueList = self.getObjectValue(viewData, templateNode.attr('tmp-each'));
			var tmpChildNode = templateParent.find('[template='+childSelector+']');
			valueList.forEach(function(v){
				childNode = self.renderView(tmpChildNode, v);
				templateNode.appendChild(childNode);
			});

			templateNode.attr('tmp-each',null);
			templateNode.attr('tmp-each-item',null);

		}
		templateNode.attr('template', null);
		templateNode.style.display = 'block';

		return templateNode;
	},

	destoryIterm : function(stackList){
		//生成了新的数组  与原来的地址不一样～
		stackList = stackList.filter(function(element){
			return !element.destory;//返回destory为false的元素
		});

		return stackList
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
		self.evolveThreshold = conf.evolveThreshold || 0.05,//最小幅度
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
	},

	/*
	 * note 运行model和clock
	 */

	run : function(){
		var self = this,
		modelLength = self.modelStack.length,
		clockLength = null;

		for(var i = 0; i < modelLength; i++){
			self.modelStack[i].run();
		}

		self.clockStack = self.destoryIterm(self.clockStack);
		clockLength = self.clockStack.length;

		for(var i = 0; i < clockLength; i++){
			self.clockStack[i].run();
		}

		requestAnimFrame(self.run);
	},

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
		self.start = new Date().getTime();//计时器开始时间 ms

		light.clockStack.push(self);
	},
}

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
			val = 	self.amplitudeMap1[x - 1][y] + self.amplitudeMap1[x + 1][y] + self.amplitudeMap1[x][y - 1] + self.amplitudeMap1[x][y + 1];

			// Damping
			val = ((val / 2.0) - self.amplitudeMap2[x][y]) * self.damping;
			
			// Clipping prevention
			if (val === 0){
				self.amplitudeMap2[x][y] = 0.0;
				continue;
			} else if (val>self.clipping) {
				val = self.clipping;
			} else if(val<-self.clipping) {
				val = -self.clipping;
			}
			
			// Evolve check
			if(Math.abs(val) > self.evolveThreshold) {
				self.evolving = true;
			} else {
				self.amplitudeMap2[x][y] = 0.0;
			}
			
			self.amplitudeMap2[x][y] = val;
		}
	}

	// Swap buffer references
	swapMap 	= self.amplitudeMap1;
	self.amplitudeMap1 	= self.amplitudeMap2;
	self.amplitudeMap2 	= swapMap;

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
		var red 	= self.pixelsIn[iPix  ];
		var green 	= self.pixelsIn[iPix+1];
		var blue 	= self.pixelsIn[iPix+2];
		
		
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
	this.amplitude();
	this.drawWaterPool();
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

light.clock.prototype.doSometing = function(){
	//等待用户自定义
}

light.clock.prototype.run = function(){
	if(this.loop === 0){
		this.destory = true;
		return;
	}

	var now = new Date().getTime();
	if(now - this.start >= this.gap){
		this.doSometing();
		this.start = now;
		this.loop--;
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