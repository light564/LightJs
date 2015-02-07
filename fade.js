/**
 * @desc    淡入淡出
 * @author  王思杰 <564774112@qq.com>
 * @date    2014-09-23
 * @update  2015-02-07
 */
;(function(win, lib){
    var $ = win['Zepto'] || win['$'];

    lib.fade = function ($target, conf) {
        var time = conf.time || '0.5s',
        fn = conf.fn,
        type = conf.type || 'in';

        var self = $target[0],
        fnOld = null,
        fnFade = function(){
            var $this = $(this),
            fnThis = null;
            
            if (type === 'out') {
                $this.css('visibility', 'hidden');
            }

            if (fn) {
                fnThis = fn.bind(this);
                fnThis();
            }
        };

        fnOld = self['fade'];
        if (fnOld) {
            $target.off('transitionend transitionEnd oTransitionend oTransitionEnd msTransitionend msTransitionEnd mozTransitionend mozTransitionEnd webkitTransitionend webkitTransitionEnd', fnOld);
        }

        self['fade'] = fnFade;

        $target.on('transitionend transitionEnd oTransitionend oTransitionEnd msTransitionend msTransitionEnd mozTransitionend mozTransitionEnd webkitTransitionend webkitTransitionEnd', fnFade);

        var transitionTime = $target.css('transition-duration') || $target.css('-o-transition-duration') || $target.css('-moz-transition-duration') || $target.css('-webkit-transition-duration'),
        transitionProperty = $target.css('transition-property') || $target.css('-o-transition-property') || $target.css('-moz-transition-property') || $target.css('-webkit-transition-property');
        
        numTransitionTime = parseFloat(transitionTime);
        console.log(numTransitionTime);
        console.log(transitionProperty);
        if (numTransitionTime !== 0 && transitionProperty.indexOf('opacity') === -1) {
            var transition = 'opacity ' + time,
            transitionDelay = $target.css('transition-delay') || $target.css('-o-transition-delay') || $target.css('-moz-transition-delay') || $target.css('-webkit-transition-delay'),
            transitionTimingFunction = $target.css('transition-timing-function') || $target.css('-o-transition-timing-function') || $target.css('-moz-transition-timing-function') || $target.css('-webkit-transition-timing-function');

            transitionTime = transitionTime.replace(' ','');
            transitionProperty = transitionProperty.replace(' ','');
            transitionDelay = transitionDelay.replace(' ','');
            transitionTimingFunction = transitionTimingFunction.replace(' ','');

            if (transitionTimingFunction.indexOf('cubic') !== -1) {
                transitionTimingFunction = transitionTimingFunction.replace('),',')|');
            }
            else{
                transitionTimingFunction = transitionTimingFunction.replace(',','|');
            }

            var transitionTimeArr = transitionTime.split(','),
            transitionPropertyArr = transitionProperty.split(','),
            transitionDelayArr = transitionDelay.split(','),
            transitionTimingFunctionArr = transitionTimingFunction.split('|'),
            length = transitionTimeArr.length;

            console.log(transition);

            for(var i = 0; i < length; i++){
                transition += ', ' + transitionPropertyArr[i] + ' ' + transitionTimeArr[i] + ' ' + transitionTimingFunctionArr[i] + ' ' + transitionDelayArr[i];
            }

            console.log(transition);

            $target.css({
                'transition': transition,
                '-moz-transition': transition, /* Firefox 4 */
                '-webkit-transition': transition, /* Safari 和 Chrome */
                '-o-transition': transition /* Opera */
            })
        } else if(numTransitionTime === 0){
            $target.css({
                'transition': 'opacity ' + time,
                '-moz-transition': 'opacity ' + time, /* Firefox 4 */
                '-webkit-transition': 'opacity ' + time, /* Safari 和 Chrome */
                '-o-transition': 'opacity ' + time /* Opera */
            });
        }
        
        if (type === 'out') {
            $target.css({
                'opacity' : '0'
            });
        } else{
            $target.css({
                'visibility' : 'visible',
                'opacity' : '1.0'
            });
        }
    }

})(window, window.lib || (window.lib = {}))