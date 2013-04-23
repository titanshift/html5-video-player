/*
	Project: blinkx HTML5 Video Player
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
$(function() {

	// Enable strict mode - best practice
	'use strict';

/* _____ EXTEND JQUERY FUNCTIONALITY _______________________________________ */

	/* $.filterNode()
	Allows quick parsing of XML nodes (including those with namespaces) */
	$.fn.filterNode = function( nodeName ) {
		return this.find( '*' ).filter( function() {
			return this.nodeName === nodeName;
		});
	};

/* _____ PLAYER CONFIGURATION ______________________________________________ */

	var Player = {

		/* _____ BEGIN CONFIGURABLE PLAYER OPTIONS _____ */

		// Change this to fit your application $( 'your-div-class-name' ). This is the div the player will be loaded into.
		playerDiv: $( '.blinkx-player' ),
		/* URL to the JSON, XML or MRSS playlist, should return valid JSON, XML or MRSS. Please view the example playlists for JSON, XML or MRSS for the appropriate structure. You can find more information about MRSS at: http://www.rssboard.org/media-rss. You will need to also grant access rights within your Tizen application's config.xml file to allow access to the domain for the URL you'll be using. */
		/* Note: Playlist structure and support has been kept basic, to allow for easier adaption to a variety of projects. You will need to add additional functionality if your application requires more. */
		playlistURL: 'examples/playlist-mrss.xml',
		// Must match the data type of your playlist: 'json', 'xml' or 'mrss'
		dataType: 'mrss',
		/* Player width and height should ideally maintain the aspect ratio of the video you're playing */
		playerWidth: 320,
		playerHeight: 180,
		// True if you want player controls displayed, false if not
		controlsEnabled: true,
		// True if you want auto-play functionality, false by default
		autoplayEnabled: false,
		// Start playing the next video once a video completes, autoplayEnabled must be set to true for this feature to work properly
		autoplayNext: false,
		// True if you want swipe events: swipe left = move to next video / swipe right = move to previous video. You will need to include the blinkx swipe plugin if you plan to enable this.
		horizontalSwipeEnabled: true,
		/* Choose where you'd like your thumbnail playlist to appear. Available options: 'top', 'bottom', 'left', 'right' or 'none' (no thumbs displayed) */
		thumbnailLayout: 'bottom',

		/* _____ END CONFIGURABLE PLAYER OPTIONS _____ */

		// Non-configurable properties used by player
		currentPosition: 0,
		numPlaylistItems: null,
		player: null,
		playlist: null,
		thumbnailWidth: 0,
		thumbnailHeight: 0,
		thumbnailAspectRatio: 0,
		/* Note: Changes to margin size may require you to make adjustments in other parts of the code. */
		thumbnailMargin: 5,
		thumbnailWidthOffset: 0,
		thumbnailHeightOffset: 0,
		thumbsDiv: null,

		// Initial state of the player on page load
		init: function() {
			var self = this;

			// Do math upfront for thumbnail sizes and layout if required
			if( this.thumbnailLayout !== 'none' ) {
				// Calculate aspect ratio ( floating )
				this.calculateAspectRatio( this.playerWidth, this.playerHeight );
				// Horizontal layout
				if( this.thumbnailLayout === 'top' || this.thumbnailLayout === 'bottom' ) {
					// Determine thumbnail dimensions based on width of player
					this.setHorizontalThumbWidth();
					this.setHorizontalThumbHeight();
					// Set height offset
					this.thumbnailHeightOffset = this.thumbnailHeight;
				} // Vertical layout
					else if( this.thumbnailLayout === 'left' || this.thumbnailLayout === 'right' ) {
					// Determine thumbnail dimensions based on height of player
					this.setVerticalThumbHeight();
					this.setVerticalThumbWidth();
					// Set height offset
					this.thumbnailWidthOffset = this.thumbnailWidth + 3;
				}
			}

			// Build initial video element HTML5 string
			this.playerDiv.html( function() {
				// Add base video tag with width and height
				var html = '<video width="' + self.playerWidth + '" height="' + self.playerHeight + '" ';
				// Add controls to video tag if enabled
				if( self.controlsEnabled ) {
					html += 'controls ';
				}
				if( self.autoplayEnabled ) {
					html += 'autoplay="autoplay" ';
				}
				// Add video close tag
				html += '></video>';
				return html;
			})
			// Set player div to same dimensions as video
			// TODO: Add math to account for width or height of thumb div based on layout chosen. Needs to be done after math for thumb dimensions is complete.
			.css({
				'width': ( self.playerWidth + self.thumbnailWidthOffset ),
				'height': ( self.playerHeight + self.thumbnailHeightOffset )
			});

			// Get reference to player <video>
			this.player = this.playerDiv.children( 'video' );

			// Fetch playlist data
			this.fetchPlaylist();

			// Add thumbnail div based on layout chosen
			switch( this.thumbnailLayout ) {
				case 'top':
					this.playerDiv.prepend( '<div class="thumbs thumbs-top"></div>' );
					break;
				case 'bottom':
					this.playerDiv.append( '<div class="thumbs thumbs-bottom"></div>' );
					break;
				case 'left':
					this.playerDiv.prepend( '<div class="thumbs thumbs-left"></div>' );
					break;
				case 'right':
					this.playerDiv.append( '<div class="thumbs thumbs-right"></div>' );
					break;
				case 'none':
					// Do nothing
					break;
			}

			/* _____ EVENT LISTENERS _____ */

			// Listen for click event on video player element and start playback
			this.player.bind( 'click', function() {
				this.play();
				self.player.unbind( 'click' );
			});
			// Listen for video ended event, and move to next video if feature is enabled
			if( this.autoplayNext ) {
				this.player.bind( 'ended', function() {
					self.loadNextVideo();
				});
			}
			if( this.horizontalSwipeEnabled ) {
				// Listen for swipe events
				this.player.touchSwipeLeft( this.onSwipeLeft );
				this.player.touchSwipeRight( this.onSwipeRight );
			}
		},
		addThumbs: function() {
			var self = this,
					html = ''
			;
			// Get reference to thumbs div
			this.thumbsDiv = this.playerDiv.children( '.thumbs' );
			html = '<ul>';
			for( var i = 0; i < this.numPlaylistItems; i++ ) {
				html += '<li><img src="' + this.playlist.tracks[ i ].image + '" alt="' + this.playlist.tracks[ i ].title + '" width="' + this.thumbnailWidth + '" height="' + this.thumbnailHeight + ' "></li>';
			}
			html += '</ul>';
			// Add thumbs HTML
			this.thumbsDiv.html( html );
			// Set height of list items
			this.thumbsDiv.find( 'ul li' ).css({
				'height': this.thumbnailHeight
			});
			// Set active state on first thumb
			this.setActiveThumb();

			// Event listeners
			this.thumbsDiv.find( 'ul li img' ).each( function( i ) {
				$( this ).bind( 'click', { index: i }, function( e ) {
					var $this = $( this ),
							index = e.data.index
					;
					$( '.active' ).removeClass( 'active' );
					$this.addClass( 'active' );
					self.player.prop({
						'poster': self.playlist.tracks[ index ].image,
						'src': self.playlist.tracks[ index ].file
					});
				});
			});
		},
		fetchPlaylist: function() {
			var self = this;
			// Fetch the playlist via AJAX
			$.ajax({
				url: this.playlistURL
			})
			.done( function( playlist ) {
				// Store playlist in playlist var
				if( self.dataType.toLowerCase() === 'json' ) {
					self.playlist = playlist;
				} else if( self.dataType.toLowerCase() === 'xml' ) {
					self.playlist = self.xmlToJson( playlist );
				} else if( self.dataType.toLowerCase() === 'mrss' ) {
					self.playlist = self.mrssToJson( playlist );
				}
				self.loadFirstVideo();
				// Add thumbs in required by layout
				if( this.thumbnailLayout !== 'none' ) {
					self.addThumbs();
				}
			})
			.fail( function() {
				// Optional: Add custom actions you want to occur if the request fails
			})
			.always( function() {
				// Optional: Add custom actions you want to occur with every fetch here
			});
		},
		getNumPlaylistItems: function( playlist ) {
			if( this.dataType.toLowerCase() === 'json' ) {
				this.numPlaylistItems = playlist.tracks.length;
				return playlist.tracks.length;
			} else if( this.dataType.toLowerCase() === 'xml' ) {
				this.numPlaylistItems = $( playlist ).find( 'track' ).length;
				return $( playlist ).find( 'track' ).length;
			} else if( this.dataType.toLowerCase() === 'mrss' ) {
				this.numPlaylistItems = $( playlist ).find( 'item' ).length;
				return $( playlist ).find( 'item' ).length;
			}
		},
		calculateAspectRatio: function( w, h ) {
			this.thumbnailAspectRatio = w / h;
		},
		loadFirstVideo: function() {
			var self = this;
			this.currentPosition = 0;
			this.player.prop({
				'src': self.playlist.tracks[0].file,
				'poster': self.playlist.tracks[0].image
			});
		},
		loadNextVideo: function() {
			var self = this;
			this.currentPosition = this.currentPosition + 1;
			if( this.currentPosition > ( this.numPlaylistItems - 1 ) ) {
				this.currentPosition = 0;
			}
			this.player.prop({
				'src': self.playlist.tracks[ this.currentPosition ].file,
				'poster': self.playlist.tracks[ this.currentPosition ].image
			});
			// Update active thumbnail
			this.setActiveThumb();
		},
		loadPreviousVideo: function() {
			var self = this;
			this.currentPosition--;
			if( this.currentPosition < 0 ) {
				this.currentPosition = this.numPlaylistItems - 1;
			}
			this.player.prop({
				'src': self.playlist.tracks[ this.currentPosition ].file,
				'poster': self.playlist.tracks[ this.currentPosition ].image
			});
			// Update active thumbnail
			this.setActiveThumb();
		},
		onSwipeLeft: function() {
			Player.loadNextVideo();
		},
		onSwipeRight: function() {
			Player.loadPreviousVideo();
		},
		mrssToJson: function( mrss ) {
			var json = {
				'tracks': []
			};
			for( var i = 0; i < this.numPlaylistItems; i++ ) {
				var item = $( mrss ).filterNode( 'item' )[ i ],
						file = $( item ).filterNode( 'media:content' ).attr( 'url' ),
						title = $( item ).filterNode( 'media:title' ).text(),
						image = $( item ).filterNode( 'media:thumbnail' ).attr( 'url' )
				;
				json.tracks[ i ] = {
					'file': file,
					'title': title,
					'image': image
				};
			}
			return json;
		},
		setActiveThumb: function() {
			$( '.active' ).removeClass( 'active' );
			this.thumbsDiv.find( 'ul li img' ).eq( this.currentPosition ).addClass( 'active' );
		},
		setHorizontalThumbWidth: function() {
			this.thumbnailWidth = ( this.playerWidth - ( this.thumbnailMargin * 4 ) ) / 5;
		},
		setHorizontalThumbHeight: function() {
			this.thumbnailHeight =  ( this.thumbnailWidth / this.thumbnailAspectRatio );
		},
		setVerticalThumbWidth: function() {
			this.thumbnailWidth = ( this.thumbnailHeight * this.thumbnailAspectRatio );
		},
		setVerticalThumbHeight: function() {
			this.thumbnailHeight = ( this.playerHeight - ( this.thumbnailMargin * 4 ) ) / 5;
		},
		xmlToJson: function( xml ) {
			var json = {
				'tracks': []
			};
			for( var i = 0; i < this.numPlaylistItems; i++ ) {
				var track = $( xml ).filterNode( 'track' )[ i ],
						file = $( track ).filterNode( 'file' ).text(),
						title = $( track ).filterNode( 'title' ).text(),
						image = $( track ).filterNode( 'image' ).text(),
						thumb = $( track ).filterNode( 'thumb' ).text()
				;
				json.tracks[ i ] = {
					'file': file,
					'title': title,
					'image': image,
					'thumb': thumb
				};
			}
			return json;
		}
	};

	// Initialize Player object
	Player.init();

});