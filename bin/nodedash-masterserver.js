/*
	NodeDash bin file.
	nodedash-masterserver will start this, and will create a masterserver at port 6278
*/

var nodedash = require("../lib/node-dash");
nodedash.server(6278);