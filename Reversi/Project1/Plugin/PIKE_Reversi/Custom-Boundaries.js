/* By Anarch16Sync.
 Changes the way the game detects map boundaries to use custom parameters on the map
 to allow for different values of boundaries horizontally and vertically.
 Custom Parameters are "BackgroundX" and "BackgroundY"
 ie. {BackgroundX:3,BackgroundY:2} makes boundaries of 3 tiles on each side and 2 tiles at the top and bottom.
*/
(function() {
CurrentMap._checkMapBoundaryValue = function(isEnabled) {
		if (isEnabled) {
			if (!DataConfig.isMapEdgePassable()) {
				// Disable X tiles at each side, and Y tiles at the top and bottom if invasion of the map edge is not allowed.
				var nx = root.getCurrentSession().getCurrentMapInfo().custom.BackgroundX
				var ny = root.getCurrentSession().getCurrentMapInfo().custom.BackgroundY
				root.getCurrentSession().setMapBoundaryValueEx(nx,ny);
			}
		}
	};
MapCursor._changeCursorValue = function(input) {
		var session = root.getCurrentSession();
		var xCursor = session.getMapCursorX();
		var yCursor = session.getMapCursorY();
		var nx = root.getCurrentSession().getCurrentMapInfo().custom.BackgroundX
		var ny = root.getCurrentSession().getCurrentMapInfo().custom.BackgroundY
		
		if (input === InputType.LEFT) {
			xCursor--;
		}
		else if (input === InputType.UP) {
			yCursor--;
		}
		else if (input === InputType.RIGHT) {
			xCursor++;
		}
		else if (input === InputType.DOWN) {
			yCursor++;
		}
		
		if (xCursor < nx) {
			xCursor = nx;
		}
		else if (yCursor < ny) {
			yCursor = ny;
		}
		else if (xCursor > CurrentMap.getWidth() - 1 - nx) {
			xCursor = CurrentMap.getWidth() - 1 - nx;
		}
		else if (yCursor > CurrentMap.getHeight() - 1 - ny) {
			yCursor = CurrentMap.getHeight() - 1 - ny;
		}
		else {
			// A cursor was moved, so play a sound.
			this._playMovingSound();
		}
		
		MapView.setScroll(xCursor, yCursor);
		
		session.setMapCursorX(xCursor);
		session.setMapCursorY(yCursor);
	};
UnitCommand.FusionRelease._isPosEnabled = function(x, y) {
		var nx = root.getCurrentSession().getCurrentMapInfo().custom.BackgroundX
		var ny = root.getCurrentSession().getCurrentMapInfo().custom.BackgroundY
		
		if (x < nx || y < ny) {
			return false;
		}
		
		if (x > CurrentMap.getWidth() - 1 - nx || y > CurrentMap.getHeight() - 1 - ny) {
			return false;
		}
		
		return true;
	};
MouseControl._adjustMapCursor = function() {
		var session = root.getCurrentSession();
		var xCursor = Math.floor((root.getMouseX() + session.getScrollPixelX() - root.getViewportX()) / GraphicsFormat.MAPCHIP_WIDTH);
		var yCursor = Math.floor((root.getMouseY()  + session.getScrollPixelY() - root.getViewportY()) / GraphicsFormat.MAPCHIP_HEIGHT);
		var nx = root.getCurrentSession().getCurrentMapInfo().custom.BackgroundX
		var ny = root.getCurrentSession().getCurrentMapInfo().custom.BackgroundY
		if (xCursor < nx) {
			xCursor = nx;
		}
		if (yCursor < ny) {
			yCursor = ny;
		}
		if (xCursor > CurrentMap.getWidth() - 1 - nx) {
			xCursor = CurrentMap.getWidth() - 1 - nx;
		}
		if (yCursor > CurrentMap.getHeight() - 1 - ny) {
			yCursor = CurrentMap.getHeight() - 1 - ny;
		}
		root.getCurrentSession().setMapCursorX(xCursor);
		root.getCurrentSession().setMapCursorY(yCursor);
	}	

})();