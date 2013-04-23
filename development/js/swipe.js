/*
	Project: blinkx Swipe Events Library
	The blinkx Video Player is an HTML5 player with playlist functionality, developed for the open source community.
	Website: www.blinkx.com
	@author Jasper Valero

	Copyright 2013 blinkx

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

			http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/
;(function( $ ) {
	var touchStartEvent,
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
		var time = new Date().getTime(),
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

		function touchEnded() {

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
					if( Math.abs( pageX - newPageX ) > scrollThreshold ) {
						event.preventDefault();
					}
				}
			}
		}
	}

})( jQuery );