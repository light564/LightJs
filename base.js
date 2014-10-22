var isIE9 = false;
if (window.navigator.userAgent.match(/MSIE\s*(\d+)/) !== null && window.navigator.userAgent.match(/MSIE\s*(\d+)/)[1] == 9) {
	isIE9 = true;
}

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
	dataType = setting['dataType'] || 'JSON',
	jsonpCallback = setting['jsonpCallback'] || function(){},
	request = new XMLHttpRequest(),
	timeout = setting['timeout'] || 10000,
	success = setting['success'] || function(){},
	error = setting['error'] || function(){},
	dataSend = '';

	if (dataType === 'JSON') {
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
	} else if (dataType === 'JSONP') {
		var script = document.createElement('script'),
		$head = $('head');

		window[jsonpCallback] = function(){
			success(arguments[0]);
		}

		script.onload = function(){
			script.removeSelf();
			script = null;
			delete window[jsonpCallback];
		}

		script.onerror = function(){
			script.removeSelf();
			script = null;
			delete window[jsonpCallback];
			error();
		}

		script.src = url;
		$head.appendChild(script);
	}
};

//DOM拓展

HTMLElement.prototype.removeSelf = function(){
	if (this.removeNode !== undefined) {
		this.removeNode(true);
	} else{
		this.remove();
	}

	return this;
}

HTMLElement.prototype.find = function(element){
	var temp = this.querySelectorAll(element);
	if (temp.length === 1 || temp.length === 0) {//undefined
		return temp[0];
	}

	return temp;
}

HTMLElement.prototype.getStyle = function(css, pseudoElt){
	if(pseudoElt === undefined)
		return window.getComputedStyle(this)[css]
	return window.getComputedStyle(this, pseudoElt)[css]
}

HTMLElement.prototype.removeClass = function(className){
	var classList = this.className.split(' '),
	listNum = -1;
	if ( (listNum = classList.indexOf(className)) !== -1 ) {
		classList.splice(listNum, 1);
	}
	this.className = classList.join(' ');
	return this;
}

HTMLElement.prototype.addClass = function(className){
	var classList = this.className.split(' ');
	if (classList.indexOf(className) === -1) {
		
		if (classList.length !== 0) {
			this.className += ' ' + className;	
		} else{
			this.className = className;
		}
		
	}
	return this;
}

HTMLElement.prototype.bindTransEnd = function(fn){
	/*if (fn === undefined) {
		return
	}*/
	this.addEventListener('transitionend', fn, true);
	this.addEventListener('webkitTransitionEnd', fn, true);
	this.addEventListener('mozTransitionEnd', fn, true);
	this.addEventListener('oTransitionEnd', fn, true);
	this.TransitionEnd = fn;
	return this;
}

HTMLElement.prototype.unbindTransEnd = function(){
	var fn = this.TransitionEnd;
	if(fn === undefined)
		return;
	this.removeEventListener('transitionend', fn, true);
	this.removeEventListener('webkitTransitionEnd', fn, true);
	this.removeEventListener('mozTransitionEnd', fn, true);
	this.removeEventListener('oTransitionEnd', fn, true);
	this.TransitionEnd = undefined;
	return this;
}

HTMLElement.prototype.fadeOut = function(fn){
	//需要增加css3过渡属性
	var self = this;

	if(self.getStyle('opacity') !== 0.0){
		self.style.opacity = '0.0';

		if (isIE9) { // ie9不支持过渡属性
			self.style.visibility = 'hidden';

			if (fn !== undefined) {
				fn()
			}
			
		} else{
			self.unbindTransEnd();
			self.bindTransEnd(function(){
				self.unbindTransEnd();
				self.style.visibility = 'hidden';
				
				if (fn !== undefined) {
					fn()
				}
			});
		}
	}
	return self;
}

HTMLElement.prototype.fadeIn = function(fn){
	//需要增加css3过渡属性
	var self = this;

	if(self.getStyle('opacity') !== 1.0){
		self.style.visibility = 'visible';

		if (isIE9) {
			self.style.opacity = '1.0';

			if (fn !== undefined) {
				fn()
			}

		} else{
			self.style.opacity = '1.0';
			self.unbindTransEnd();
			self.bindTransEnd(function(){
				self.unbindTransEnd();
				if (fn !== undefined) {
					fn()
				}
			});
		}
	}
	return self;
}

HTMLElement.prototype.getOffset = function(){
	var self = this;
	var offset = {
		'left' : self.offsetLeft + self.clientLeft,
		'top'  : self.offsetTop + self.clientTop
	};

	while(self.offsetParent.nodeName !== 'BODY'){
		self = self.offsetParent;
		offset['left'] += self.offsetLeft + self.clientLeft;
		offset['top'] += self.offsetTop + self.clientTop;
	}
	return offset;
}

/*
 *	note 存在第二个参数时，值为null为删除此attr;不为null则为设定attr的值
 *
 */
HTMLElement.prototype.attr = function(){
	if (arguments.length === 1) {
		var attrValue = this.getAttribute(arguments[0]);//不存在则为null
		if (attrValue === null) {
			return '';	
		}
		return attrValue;
	} else if (arguments[1] !== null) {
		this.setAttribute(arguments[0], arguments[1]);
		return this;
	} else if (arguments[1] === null) {
		this.removeAttribute(arguments[0]);
	}
}

NodeList.prototype.forEach = function(fn){
	var length = this.length;
	for(var i = 0; i < length; i++){
		fn.call(this[i],this[i],i);
	}
	return this;
}