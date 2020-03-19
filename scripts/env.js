var fs = require('fs');

function reducer(whitelistedVariables, variable) {
	whitelistedVariables[variable] = process.env[variable];
	return whitelistedVariables;
}

function strip(str) {
	return str.trim();
}

function generateBody() {
	var template = fs.readFileSync("/etc/nginx/scripts/env.tmpl");
	var whitelist = fs.readFileSync("/etc/nginx/scripts/whitelist.conf").split(",").map(strip);
	var environmentMap = whitelist.reduce(reducer, {});
	return template.replace("{{ENV}}", JSON.stringify(environmentMap));
}

function getEnvMap(request) {
	request.headersOut["Content-Type"] = "application/javascript";

	request.return(
		200,
		generateBody()
	);
}

function plainPage(request) {
	request.headersOut["Content-Type"] = "text/html";

	request.return(
		200,
		'<script src="/env.js"></script>'
	)
}
