function $(element){
	if(element[0] == '#')
		return document.querySelector(element);
	else{
		var temp = document.querySelectorAll(element);
		if (temp.length === 1 || temp.length === 0) {
			return temp[0];
		}
		
		return temp;
	}
}

$.ajax = function(setting){
	var rtype = setting['type'] || 'GET',
	url = setting['url'] || '',
	data = setting['data'] || {},
	request = new XMLHttpRequest(),
	timeout = setting['timeout'] || 10000,
	success = setting['success'] || function(){},
	error = setting['error'] || function(){},
	dataSend = '';

	for(var key in data){
		dataSend += key + '=' + data[key] + '&'
	}
	dataSend = dataSend.slice(0,dataSend.length-1);
	request.open(rtype, url, true);
	request.setRequestHeader('Content-type','application/x-www-form-urlencoded');
	request.send(dataSend);

	request.onreadystatechange = function(){

		if (request.readyState === 4) {

			if (request.status === 200) {
				if(timer !== undefined)
					clearTimeout(timer);
				success(JSON.parse(request.responseText));
			} else if (request.status === 400) {
				if(timer !== undefined)
					clearTimeout(timer);
				error(JSON.parse(request.responseText));
			} else if (request.status === 400) {
				if(timer !== undefined)
					clearTimeout(timer);
				error(JSON.parse(request.responseText));
			}
		}

	}
	var timer = setTimeout(function(){
		request.abort();
		error('request time out');
	}, timeout);
};

//DOM拓展

HTMLElement.prototype.removeSelf = function(){
	var self = this;

	if (self.removeNode !== undefined) {
		self.removeNode(true);
	} else{
		self.remove();
	}

	return self;
}

HTMLElement.prototype.find = function(element){
	var self = this,
	temp = self.querySelectorAll(element);
	if (temp.length === 1 || temp.length === 0) {//undefined
		return temp[0];
	}

	return temp;
}

HTMLElement.prototype.getStyle = function(css, pseudoElt){
	var self = this;
	if(pseudoElt === undefined)
		return window.getComputedStyle(self)[css]
	return window.getComputedStyle(self, pseudoElt)[css]
}

HTMLElement.prototype.removeClass = function(className){
	var self = this,
	classList = self.className.split(' '),
	listNum = -1;
	if ( (listNum = classList.indexOf(className)) !== -1 ) {
		classList.splice(listNum, 1);
	}
	self.className = classList.join(' ');
	return self;
}

HTMLElement.prototype.addClass = function(className){
	var self = this,
	classList = self.className.split(' ');
	if (classList.indexOf(className) === -1) {
		
		if (classList.length !== 0) {
			self.className += ' ' + className;	
		} else{
			self.className = className;
		}
		
	}
	return self;
}

HTMLElement.prototype.bindCssEvent = function(key, fn){
	var self = this,//TransitionEnd
	fnThis = fn.bind(self);
	/*if (fn === undefined) {
		return
	}*/
	self.addEventListener(key, fnThis, true);

	key = key[0].toUpperCase() + key.slice(1);

	self.addEventListener('webkit' + key, fnThis, true);
	self.addEventListener('moz' + key, fnThis, true);
	self.addEventListener('o' + key, fnThis, true);
	self[key] = fnThis;
	return self;
}

HTMLElement.prototype.unbindCssEvent = function(key){
	var self = this,
	fn = self[key];
	if(fn === undefined)
		return;
	self.removeEventListener(key, fn, true);

	key = key[0].toUpperCase() + key.slice(1);

	self.removeEventListener('webkit' + key, fn, true);
	self.removeEventListener('moz' + key, fn, true);
	self.removeEventListener('o' + key, fn, true);
	self[key] = undefined;
	return self;
}

HTMLElement.prototype.cssProperty = function(key, value){
	var self = this;

	self.style[key] = value;
	key = key[0].toUpperCase() + key.slice(1);
	self.style['o' + key] = value;
	self.style['ms' + key] = value;
	self.style['moz' + key] = value;
	self.style['webkit' + key] = value;

	return self;
}

HTMLElement.prototype.bindTransEnd = function(fn){
	var self = this;
	self.bindCssEvent('transitionend', fn);
	return self;
}

HTMLElement.prototype.unbindTransEnd = function(){
	var self = this,
	fn = self.TransitionEnd;
	if(fn === undefined)
		return;
	self.unbindCssEvent('transitionend', fn);
	return self;
}

HTMLElement.prototype.fadeOut = function(fn){
	var self = this;
	//需要增加css3过渡属性
	if(self.getStyle('opacity') !== 0.0){
		self.style.opacity = "0.0";
		self.unbindTransEnd();
		self.bindTransEnd(function(){
			self.unbindTransEnd();
			self.style.visibility = "hidden";
			if (fn !== undefined) {
				fn()
			}
		});
	}
	return self;
}

HTMLElement.prototype.fadeIn = function(fn){
	var self = this;
	//需要增加css3过渡属性
	if(self.getStyle("opacity") !== 1.0){
		self.style.visibility = "visible";
		self.style.opacity = "1.0";
		self.unbindTransEnd();
		self.bindTransEnd(function(){
			self.unbindTransEnd();
			if (fn !== undefined) {
				fn()
			}
		});
	}
	return self;
}

HTMLElement.prototype.getOffset = function(){
	var self = this;
	var offset = {
		"left" : self.offsetLeft + self.clientLeft,
		"top"  : self.offsetTop + self.clientTop
	};

	while(self.offsetParent.nodeName !== "BODY"){
		self = self.offsetParent;
		offset["left"] += self.offsetLeft + self.clientLeft;
		offset["top"] += self.offsetTop + self.clientTop;
	}
	return offset;
}

/*
 *	note 存在第二个参数时，值为null为删除此attr;不为null则为设定attr的值
 *
 */
HTMLElement.prototype.attr = function(){
	var self = this;
	if (arguments.length === 1) {
		var attrValue = self.getAttribute(arguments[0]);//不存在则为null
		if (attrValue === null) {
			return '';	
		}
		return attrValue;
	} else if (arguments[1] !== null) {
		self.setAttribute(arguments[0], arguments[1]);
		return self;
	} else if (arguments[1] === null) {
		self.removeAttribute(arguments[0]);
	}
}

NodeList.prototype.forEach = function(fn){
	var self = this,
	length = self.length;
	for(var i = 0; i < length; i++){
		fn.call(self[i],self[i],i);
	}
	return self;
}