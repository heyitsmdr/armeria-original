var API = function () {
	var self = this;

	self.hereDoc = function(f) {
		return f.toString().
		  replace(/^[^\/]+\/\*!?/, '').
		  replace(/\*\/[^\/]+$/, '');
	}

	self.charinfo = function(charId) {
		var ch = CHARACTERS.getCharacterById(charId);

		if(!ch) {
			return "No character found with that id.";
		}

		var html = self.hereDoc(function() {/*
			<table>
				<tr>
					<td>
						<img src='{USER_PICTURE}' style='margin-right:10px' align='left'><h2 style='line-height:0;padding-top:5px;'>{USER_NAME}</h2>
						<br/>
						Level <strong>1</strong> Wizard
						<br/><br/>
						<h3>Equipment</h3>
						{USER_EQUIPMENT}
					</td>
					<td>
						<h1>Latest Events</h1>
					</td>
				</tr>
			</table>
		*/});

		html = html.replace('{USER_NAME}', ch.name);
		html = html.replace('{USER_PICTURE}', ch.picture);
		html = html.replace('{USER_EQUIPMENT}', JSON.stringify(ch.equipment));

		return html;
	};
};

exports.API = API;