/**
 * HoverScroll jQuery UI widget
 *
 * Make an unordered list scrollable by hovering the mouse over it.
 *
 * @author RasCarlito <carl.ogren@gmail.com>
 * @version 0.3a
 * @revision 22
 *
 * FREE BEER LICENSE VERSION 1.02
 *
 * The free beer license is a license to give free software to you and free
 * beer (in)to the author(s).
 */
(function($, undefined) {

var createCount = 0;

$.widget("ui.hoverscroll", {
    options: {
        vertical:	false,      // Display the list vertically or not
        width:		400,        // Width of the list
        height:		50,         // Height of the list
        maxSpeed:   20,         // Maximum speed displacement
        arrows:		true,       // Display arrows to the left and top or the top and bottom
        arrowsOpacity: 0.7,     // Maximum opacity of the arrows if fixedArrows
        fixedArrows: false,     // Fix the displayed arrows to the side of the list
        rtl:		false,		// Set display mode to "Right to Left"
		refreshRate: 50,		// Animation timer refresh rate

		create: function(event, ui) {},
		start: function(event, ui) {},
		move: function(event, ui) {},
		stop: function(event, ui) {},
		resize: function(event, ui) {},

        debug:		false        // Display some debugging information in firebug console (do not activate without firebug)
    },

    _create: function() {
        var self = this, o = this.options;

        createCount++;

        if (o.debug) {
            log("[HoverScroll] Creating hoverscroll on element " +
                this.element[0].tagName + "#" + this.element[0].id);
        }

        // wrap ul list with a div.listcontainer
        if (o.fixedArrows) {this.element.wrap('<div class="fixed-listcontainer"></div>');}
        else {this.element.wrap('<div class="listcontainer"></div>');}

        this.element.addClass("list");

        // store handle to listcontainer
        var listctnr = this.element.parent();

        // wrap listcontainer with a div.hoverscroll
        listctnr.wrap('<div class="ui-widget-content hoverscroll' +
			(o.rtl && !o.vertical ? " rtl" : "") + '"></div>');

        // store handle hoverscroll container
        var ctnr = listctnr.parent();

        // Add arrow containers
        if (o.arrows) {
            if (o.vertical) {
                if (o.fixedArrows) {
                    listctnr.before('<div class="fixed-arrow top"></div>')
                        .after('<div class="fixed-arrow bottom"></div>');
                }
                else {
                    listctnr.append('<div class="arrow top"></div>')
                        .append('<div class="arrow bottom"></div>');
                }
            }
            else {
                if (o.fixedArrows) {
                    listctnr.before('<div class="fixed-arrow left"></div>')
                        .after('<div class="fixed-arrow right"></div>');
                }
                else {
                    listctnr.append('<div class="arrow left"></div>')
                        .append('<div class="arrow right"></div>');
                }
            }
        }

        // Apply width and height parameters
        ctnr.width(o.width).height(o.height);

		// Calculate and apply width and height parameters
		// on the list container for fixed arrows
        if (o.arrows && o.fixedArrows) {
            if (o.vertical) {
                listctnr.width(o.width)
                    .height(o.height - (listctnr.prev().height() + listctnr.next().height()));
            }
            else {
                listctnr.height(o.height)
                    .width(o.width - (listctnr.prev().width() + listctnr.next().width()));
            }
        }
        else {
            listctnr.width(o.width).height(o.height);
        }

        var size = 0;

        if (o.vertical) {
            ctnr.addClass("vertical");

            // Determine content height
            this.element.children().each(function() {
                $(this).addClass("item");
                size += $(this).outerHeight(true);
            });
            // Apply computed height to listcontainer
            this.element.height(size);

            if (o.debug) {
				log("[HoverScroll] Computed content height : " + size + "px");
			}

            // Retrieve container height instead of using the given params.height to include padding
            size = ctnr.outerHeight();

			if (o.debug) {
				log('[HoverScroll] Computed container height : ' + size + 'px');
			}
        }
        else {
            ctnr.addClass('horizontal');

			// Determine content width
			this.element.children().each(function() {
				$(this).addClass("item");
                size += $(this).outerWidth(true);
			});
			// Apply computed width to listcontainer
			this.element.width(size);

			if (o.debug) {
				log('[HoverScroll] Computed content width : ' + size + 'px');
			}

			// Retrieve container width instead of using the given params.width to include padding
            size = ctnr.outerWidth();

			if (o.debug) {
				log('[HoverScroll] Computed container width : ' + size + 'px');
			}
        }

        // Initialize "right to left" option if specified
		if (o.rtl && !o.vertical) {
            listctnr[0].scrollLeft = listctnr[0].scrollWidth - listctnr.width();
            if (o.debug) {
                log("[HoverScroll] Start position for Right to Left mode set to " + listctnr[0].scrollLeft + "px");
            }
		}

        // Bind actions to the hoverscroll container
		ctnr
		// Bind checkMouse to the mousemove
		.mousemove(function(e) {self._checkMouse(e.pageX, e.pageY);})
        // Bind stopMoving to the mouseleave
        .mouseleave(function() {self.stop();});
		
		this.ctnr = ctnr;
        this.listctnr = listctnr;

        // Determine width:speed relationship constant
		this._getSpeedConstant();
		
        this.isMoving = false;

        if (o.arrows && !o.fixedArrows) {
			// Initialise arrow opacity
			this._setArrowOpacity();
		}
		else {
			// Hide arrows
			$('.arrowleft, .arrowright, .arrowtop, .arrowbottom', ctnr).hide();
		}
    },
	
	_getSpeedConstant: function() {
		if (!this.options.vertical) {
			this.speedConstant = (this.ctnr.width() / 2) / (this.ctnr.width() * Math.pow(this.options.maxSpeed, 1/3));
		}
        else {
			this.speedConstant = (this.ctnr.height() / 2) / (this.ctnr.height() * Math.pow(this.options.maxSpeed, 1/3));
		}
        if (this.options.debug) {
            log("[HoverScroll] Container size:Speed relationship set to " + this.speedConstant);
        }
	},

    _checkMouse: function(x, y) {
        var ctnrSize, ctnrOffset, cursorPos;
        if (this.options.vertical) {
            ctnrSize = this.ctnr.height();
            ctnrOffset = this.ctnr.offset().top;
            cursorPos = y;
        }
        else {
            ctnrSize = this.ctnr.width();
            ctnrOffset = this.ctnr.offset().left;
            cursorPos = x;
        }

        cursorPos = (cursorPos - ctnrOffset) - (ctnrSize / 2);
        if (this.cursorPos == cursorPos) {return;}
        this.cursorPos = cursorPos;
        
        y = Math.round(Math.pow(cursorPos / (this.speedConstant * ctnrSize), 3));
        if (this.speed == y) {return;}
        if ((y < 1 && y > -1)) {
            this.stop();
            return;
        }

        this.start(y);
    },

    _setArrowOpacity: function() {
        var o = this.options, done = false, maxScroll, scroll, limit, opacity;
        if (!o.arrows || o.fixedArrows) {return;}
        
        if (o.vertical) {
            maxScroll = this.listctnr[0].scrollHeight - this.listctnr.height();
			scroll = this.listctnr[0].scrollTop;
        }
        else {
            maxScroll = this.listctnr[0].scrollWidth - this.listctnr.width();
			scroll = this.listctnr[0].scrollLeft;
        }
        limit = o.arrowsOpacity;

        // Optimization of opacity control by Josef Körner
        // Initialize opacity; keep it between its extremas (0 and limit) we don't need to check limits after init
        opacity = (scroll / maxScroll) * limit;

        if (opacity > limit) {opacity = limit;}
		if (isNaN(opacity)) {opacity = 0;}

        // Check if the arrows are needed
        // Thanks to <admin at unix dot am> for fixing the bug that displayed the right arrow when it was not needed
        if (opacity <= 0) {
            $('div.arrow.left, div.arrow.top', this.ctnr).hide();
            if(maxScroll > 0) {
                $('div.arrow.right, div.arrow.bottom', this.ctnr).show().css('opacity', limit);
            }
            done = true;
        }
        if (opacity >= limit || maxScroll <= 0) {
            $('div.arrow.right, div.arrow.bottom', this.ctnr).hide();
            done = true;
        }

        if (!done) {
            $('div.arrow.left, div.arrow.top', this.ctnr).show().css('opacity', opacity);
            $('div.arrow.right, div.arrow.bottom', this.ctnr).show().css('opacity', (limit - opacity));
        }
    },

    _move: function() {
        if (!this.isMoving) {return;}

        this._setArrowOpacity();

        var self = this, scrollSide;
        if (!this.options.vertical) {scrollSide = "scrollLeft";}
        else {scrollSide = "scrollTop";}

        this.listctnr[0][scrollSide] += this.speed;
        this.timer = setTimeout(function() {
            self._move();
        }, this.options.refreshRate);
		
		if ($.isFunction(this.options.move)) {
			this.options.move();
		}
    },

    start: function(speed) {
        if (typeof speed != "undefined" && this.speed != speed) {
            if (this.options.debug) {
                log('[HoverScroll] Starting to move. Speed: ' + speed);
            }

//            this.stop();
			clearTimeout(this.timer);
            this.speed = speed;
            this.isMoving = true;
            this._move();
			
			if ($.isFunction(this.options.start)) {
				this.options.start();
			}
        }
    },

    stop: function() {
        if (this.isMoving) {
            this.isMoving = false;
            this.speed = 0;
            clearTimeout(this.timer);
			
			if ($.isFunction(this.options.stop)) {
				this.options.stop();
			}
        }
    }
});



/**
 * log errors to consoles (firebug, opera) if exist, else uses alert()
 */
function log() {
	try {console.log.apply(console, arguments);}
	catch (e) {
		try {opera.postError.apply(opera, arguments);}
		catch (e) {}
	}
};

})(jQuery);


