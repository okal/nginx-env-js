# nginx-env-js

NGINX Script to Expose Environment Variables to Client Side Javascript.

## The Problem

When deploying stateless SPAs, it's often necessary to embedd environment
variables at build time to cater for different, well, environments. That
might mean having as many different builds as there are environments,
or having a base build with some of the foundational work done beforehand
and some done in the deployment environment. This makes some amount of drift
between the environments unavoidable, and also adds precious seconds/minutes
to build time due to the per-environment customisations.


## A Possible Solution

This investigation explores how to share a single build artifact for an SPA
deployed in multiple environments. It assumes that the developer has control
of the HTTP server (NGINX, in this case, but the approach can be replicated
for any scriptable webserver). That means it won't work for SPAs deployed
to object stores such as S3.

## How it works

NGINX provides a module, NGINX Javascript, that spins up a JS VM per request
allowing on the fly manipulation of requests. It isn't intended to be as full
featured as, say, Node or Rhino. It's intended to be used for writing
middleware, rather than fully fledged applications.

### NGINX configuration

```
load_module modules/ngx_http_js_module.so;

events {}

http {
    js_include scripts/env.js;

    server {
        listen 80;

        location / {
            js_content plainPage;
        }

        location /env.js {
            js_content getEnvMap;
        }
    }
}
```

### scripts/env.js

```javascript
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
```

### scripts/env.tmpl

A template to generate the client side script. Uses simple string substitution.

```javascript
window.process = {}
window.process.env = {{ENV}}
```

### scripts/whitelist.conf
Comma-separated list of the names environment variables you want to expose
to the client

```
FACADE_URL, DEBUG_ENABLED
```


## To Run the Example

From the project root, run:

```
docker build .
docker run -itp 8080:80 <image_hash>
```

Navigate to http://localhost:8080/

Open the web developer console, and type in `process.env`. An object containing the environment variables will be displayed.
Note the absence of the variable `$ANSWER` defined in the Dockerfile, but absent from the whitelist.

To see how it works, you may modify the environment variables set in the Dockerfile, and those present in the whitelist. That
will require you to rebuild and restart.

## Caveats

I haven't really thought through the security implications of this approach
yet, beyond having a whitelist to limit the environment variables exposed to
the client. This is intended as a show of what's possible, rather than a drop
in library to use for your production setup.
