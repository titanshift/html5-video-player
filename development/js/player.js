/*
	Project: blinkx/Tizen HTML5 Video Player
	This open source project was created by blinkx for the Tizen community. It is released under the ??? license.
	Website: www.blinkx.com
	@author Jasper Valero
*/

$(function() {

	// Enable strict mode - best practice
	'use strict';

/* _____ Extend jQuery Functionality _______________________________________ */

	/* $.filterNode ()
	Allows for quick parsing of XML nodes */
	$.fn.filterNode = function( nodeName ) {
		return this.find( '*' ).filter( function() {
			return this.nodeName === nodeName;
		});
	};

/* _____ PLAYER CONFIGURATION ______________________________________________ */

	var Player = {

		/* _____ BEGIN CONFIGURABLE PLAYER OPTIONS _____ */

		// Change this to fit your application $( 'your-div-class-name' )
		playerDiv: $( '.blinkx-player' ),
		/* URL to the JSON, XML or MRSS playlist, should return valid JSON, XML or MRSS. Please view the example playlists for JSON, XML or MRSS for the appropriate structure. You can find more information about MRSS at: http://www.rssboard.org/media-rss. You will need to also grant access rights within your Tizen application's config.xml to allow access to the domain for the URL you are using. */
		/* Note: Playlist structure and support has been kept basic, to allow for easier adaption to many different projects. You will need to add additional functionality if your application requires more. */
		playlistURL: 'data/playlist-mrss.xml',
		// Must match the data type of your playlist: 'json', 'xml' or 'mrss'
		dataType: 'mrss',
		playerWidth: '320',
		playerHeight: '180',
		// True if you want player controls displayed, false if not
		controlsEnabled: true,
		// True if you want auto-play functionality, false by default
		autoplayEnabled: false,
		// Start playing the next video once a video completes, autoplayEnabled must be set to true for this feature to work properly
		autoplayNext: false,

		/* _____ END CONFIGURABLE PLAYER OPTIONS _____ */

		// Non-configurable properties used by player
		player: null,
		playlist: null,
		numPlaylistItems: null,
		currentPosition: null,

		// Initial state of the player on page load
		init: function() {
			var self = this;
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
			});
			this.player = this.playerDiv.children( 'video' );
			// Fetch playlist data
			this.fetchPlaylist();

			/* _____ EVENT LISTENERS _____ */

			// Listen for click event on video player element and start playback
			this.player.bind( 'click', function() {
				this.play();
				self.player.unbind( 'click' );
			});
			this.playerDiv.siblings( '.test' ).find( '.prev' ).bind( 'click', function() {
				console.log( 'Prev' );
				self.loadPreviousVideo();
			});
			this.playerDiv.siblings( '.test' ).find( '.next' ).bind( 'click', function() {
				console.log( 'Next' );
				self.loadNextVideo();
			});
			// Listen for video ended event, and move to next video if feature is enabled
			if( this.autoplayNext ) {
				this.player.bind( 'ended', function() {
					console.log( 'Video ended.' );
					self.loadNextVideo();
				});
			}
			// Listen for swipe events
			this.player.touchSwipeLeft( this.onSwipeLeft );
			this.player.touchSwipeRight( this.onSwipeRight );
		},
		fetchPlaylist: function() {
			var self = this;
			// Fetch the playlist via AJAX
			$.ajax({
				url: this.playlistURL
			})
			.done( function( playlist ) {
				// Determine number of items fetched from JSON or XML
				var numPlaylistItems = self.getNumPlaylistItems( playlist );
				// Store playlist in playlist var
				if( self.dataType.toLowerCase() === 'json' ) {
					self.playlist = playlist;
				} else if( self.dataType.toLowerCase() === 'xml' ) {
					self.playlist = self.xmlToJson( playlist );
				} else if( self.dataType.toLowerCase() === 'mrss' ) {
					self.playlist = self.mrssToJson( playlist );
				}
				self.loadFirstVideo();
				// Output success message with number items fetched
				console.log( '' + numPlaylistItems + ' playlist items fetched successfully!' );
			})
			.fail( function() {
				// Display console error message if fetch fails
				console.error( 'There was a problem fetching the playlist. Please double check the playlistURL and dataType and try again.' );
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
			console.log( this );
			this.currentPosition = this.currentPosition + 1;
			if( this.currentPosition > ( this.numPlaylistItems - 1 ) ) {
				this.currentPosition = 0;
			}
			this.player.prop({
				'src': self.playlist.tracks[ this.currentPosition ].file,
				'poster': self.playlist.tracks[ this.currentPosition ].image
			});
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
		},
		onSwipeLeft: function() {
			Player.loadNextVideo();
			console.log( 'Swipe Left - Load Next Video' );
		},
		onSwipeRight: function() {
			Player.loadPreviousVideo();
			console.log( 'Swipe Right - Load Previous Video' );
		},
		mrssToJson: function( mrss ) {
			var json = {
				'tracks': []
			};
			for( var i = 0; i < this.numPlaylistItems; i++ ) {
				var
					item = $( mrss ).filterNode( 'item' )[ i ],
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
		xmlToJson: function( xml ) {
			var json = {
				'tracks': []
			};
			for( var i = 0; i < this.numPlaylistItems; i++ ) {
				var
					track = $( xml ).filterNode( 'track' )[ i ],
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

/* _____ INITIAL PLAYER SETUP ______________________________________________ */

});