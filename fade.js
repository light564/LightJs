/**
 * @desc    淡入淡出
 * @author  王思杰 <564774112@qq.com>
 * @date    2014-09-23
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

        var transition = $target.css('transition') || $target.css('-o-transition') || $target.css('-moz-transition') || $target.css('-webkit-transition');
        
        if (transition !== null && transition.indexOf('opacity') === -1) {
            $target.css({
                'transition': 'opacity ' + time + ', ' + transition,
                '-moz-transition': 'opacity ' + time + ', ' + transition, /* Firefox 4 */
                '-webkit-transition': 'opacity ' + time + ', ' + transition, /* Safari 和 Chrome */
                '-o-transition': 'opacity ' + time + ', ' + transition /* Opera */
            })
        } else if(transition === null){
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