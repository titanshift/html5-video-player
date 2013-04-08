/*
	Project: blinkx/Tizen Swipe Events
	This open source project was created by blinkx for the Tizen community. It is released under the ??? license.
	Website: www.blinkx.com
	@author Jasper Valero
*/

/*
* Stripped the touch swipe logic from jQuery Mobile and turned it into this plugin
* Copyright 2012 (c) CodingJack - http://codecanyon.net/user/CodingJack
* Dual licensed under the MIT or GPL Version 2 licenses.
*/

/* USAGE

// listen both left and right signals, the String "left" or "right" will be passed as an argument to the callback
* $(element).touchSwipe(callback);

// second parameter is optional and will invoke "event.stopImmediatePropagation()"
// use this if you need to prevent other mouse events from firing on the same object when a swipe gesture is detected
* $(element).touchSwipe(callback, true);

// listen for only the left swipe event
* $(element).touchSwipeLeft(callback);

// listen for only the right swipe event
* $(element).touchSwipeRight(callback);

// unbind both left and right swipe events
* $(element).unbindSwipe();

// unbind only left swipe event
* $(element).unbindSwipeLeft();

// unbind only right swipe event
* $(element).unbindSwipeRight();


// SPECIAL NOTES
* all methods return "this" for chaining
* before a plugin event is added, "unbind" is called first to make sure events are never erroneously duplicated

*/

;(function( $ ) {
	var
		touchStartEvent,
		touchStopEvent,
		touchMoveEvent,
		horizontalThreshold = 30,
		verticalThreshold = 75,
		scrollThreshold = 10,
		durationThreshold = 1000
	;

	if( 'ontouchend' in document ) {
		touchStartEvent = 'touchend.blinkx';
		touchMoveEvent = 'touchmove.blinkx';
		touchStartEvent = 'touchstart.blinkx';
	} else {
		touchStopEvent = 'mouseup.blinkx';
		touchMoveEvent = 'mousemove.blinkx';
		touchStartEvent = 'mousedown.blinkx';
	}

	$.fn.touchSwipe = function( callback, prevent ) {
		if( prevent ) {
			this.data( 'stopPropagation', true );
		}
		if( callback ) {
			return this.each( swipeBoth, [ callback ] );
		}
	};
	$.fn.touchSwipeLeft = function( callback, prevent ) {
		if( prevent ) {
			this.data( 'stopPropagation', true );
		}
		if( callback ) {
			return this.each( swipeLeft, [ callback ] );
		}
	};
	$.fn.touchSwipeRight = function( callback, prevent ) {
		if( prevent ) {
			this.data( 'stopPropagation', true );
		}
		if( callback ) {
			return this.each( swipeRight, [ callback ] );
		}
	};
	$.fn.unbindSwipe = function( changeData ) {
		if( !changeData ) {
			this.removeData( 'swipeLeft swipeRight stopPropagation' );
		}
		return this.unbind( touchStartEvent + ' ' + touchMoveEvent + ' ' + touchStopEvent );
	};
	$.fn.unbindSwipeLeft = function() {
		this.removeData( 'swipeLeft' );
		if( !this.data( 'swipeRight' ) ) {
			this.unbindSwipe( true );
		}
	};
	$.fn.unbindSwipeRight = function() {
		this.removeData( 'swipeRight' );
		if( !this.data( 'swipeLeft') ) {
			this.unbindSwipe( true );
		}
	};

	function swipeBoth( callback ) {
		$( this ).touchSwipeLeft( callback ).touchSwipeRight( callback );
	}
	function swipeLeft( callback ) {
		var $this = $( this );
		if( !$this.data( 'swipeLeft' ) ) {
			$this.data( 'swipeLeft', callback );
		}
		if( !$this.data( 'swipeRight' ) ) {
			addSwipe( $this );
		}
	}
	function swipeRight( callback ) {
		var $this = $( this );
		if( !$this.data( 'swipeRight' ) ) {
			$this.data( 'swipeRight', callback );
		}
		if( !$this.data( 'swipeLeft' ) ) {
			addSwipe( $this );
		}
	}
	function addSwipe( $this ) {
		$this.unbindSwipe( true ).bind( touchStartEvent, $this, touchStart );
	}
	function touchStart( event ) {
		var
			time = new Date().getTime(),
			data = event.originalEvent.touches ? event.originalEvent.touches[0] : event,
			$this = $(this).bind( touchMoveEvent, $this, moveHandler ).one( touchStopEvent, touchEnded ),
			pageX = data.pageX,
			pageY = data.pageY,
			newPageX,
			newPageY,
			newTime
		;

		if( $this.data( 'stopPropagation' ) ) {
			event.stopImmediatePropagation();
		}

		function touchEnded( event ) {

			$this.unbind( touchMoveEvent );

			if( time && newTime ) {
				if( newTime - time < durationThreshold && Math.abs( pageX - newPageX ) > horizontalThreshold && Math.abs( pageY - newPageY ) < verticalThreshold ) {
					if( pageX > newPageX ) {
						if( $this.data( 'swipeLeft' ) ) {
							$this.data( 'swipeLeft' )( 'left' );
						}
					} else {
						if( $this.data( 'swipeRight' ) ) {
							$this.data( 'swipeRight' )( 'right' );
						}
					}
				}
			}
			time = newTime = null;
		}

		function moveHandler( event ) {
			if( time ) {
				data = event.originalEvent.touches ? event.originalEvent.touches[0] : event;
				newTime = new Date().getTime();
				newPageX = data.pageX;
				newPageY = data.pageY;

				if( window.navigator.msPointerEnabled && Math.abs( pageX - newPageX ) > 30 ) {
					$this.unbind( touchMoveEvent );
					if( pageX > newPageX ) {
						if( $this.data( 'swipeLeft' ) ) {
							$this.data( 'swipeLeft' )( 'left' );
						}
					} else {
						if( $this.data( 'swipeRight' ) ) {
							$this.data( 'swipeRight' )( 'right' );
						}
					}
				}
				else {
					if( Math.abs( pageX - newPageX ) > scrollThreshold ) event.preventDefault();
				}
			}
		}
	}

})( jQuery );