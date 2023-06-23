const ctx = require("../ctx");
const _ = require("lodash");

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * perform
 *
 * triggers on a new row in table
 *
 * @param {ZObject} z
 * @param {Bundle} bundle
 * @return {Promise<Array<{object}>|Array<{object}>|number|SQLResultSetRowList|HTMLCollectionOf<HTMLTableRowElement>|string>}
 */
const perform = async (z, bundle) => {
    // required to get access_token:
    const dtableCtx = await ctx.acquireDtableAppAccess(z, bundle);
  
    // bundle.authData.server           = https://stage.seatable.io
    // bundle.inputData.http_method     = POST
    // bundle.inputData.endpoint        = adfadfa
    // bundle.inputData.querys          = {"query1":"qvalue1","query2":"qvalue2"}
    // bundle.inputData.headers         = {"header1":"hvalue1"}
    // bundle.inputData.body            = ...
    
    // validate endpoint (must start with "/dtable-");
    const regex = /^\/dtable-(server|db)\/.*/;
    if (!regex.test(bundle.inputData.endpoint)) {
        throw new Error("The URL of your request must start with either /dtable-server/ or /dtable-db/. Please change the URL and try again.");
    }

    // build query params
    let queryString = "";
    if(bundle.inputData.querys && typeof bundle.inputData.querys === "object" && bundle.inputData.querys.length() > 0){
        queryString = Object.keys(bundle.inputData.querys).map(function(key) {
            return key + '=' + bundle.inputData.querys[key]
        }).join('&');
        queryString = `?${queryString}`
    }
    
    // check body input
    z.console.log("inputDataRaw.body", bundle.inputData.body);
    if(!isJsonString(bundle.inputData.body)){
        throw new Error("Your body seems to be no valid JSON.");
    }
    const body = bundle.inputData.body;

    const request = {
        url: `${bundle.authData.server}${bundle.inputData.endpoint}${queryString}`,
        method: `${bundle.inputData.http_method}`,
        headers: {
            "Authorization": `Token ${dtableCtx.access_token}`,
            "accept": "application/json",
            "content-type": "application/json",
        },
        body,
    }
    z.console.log("API Request (beta)", request);

    const response = await z.request(request);
    return response.data;
}

module.exports = {
    key: "api_request",
    noun: "API Request (Beta)",
    display: {
      label: "API Request (Beta)",
      description: "This is an advanced action to execute an SeaTable API call via Zapier on this base. You can get all possible requests and their parameters from the https://api.seatable.io.",
    },
    operation: {
        perform,
        inputFields: [
            {
                key: "http_method",
                required: true,
                label: "HTTP Method",
                choices: { "POST": "POST", "GET": "GET", "PUT": "PUT", "DELETE": "DELETE" },
            },
            {
                key: "endpoint",
                required: true,
                label: "URL",
                helpText: `The URL has to start with */dtable-server/* or */dtable-db/*. All possible requests can be found at the [SeaTable API Reference](https://api.seatable.io). Please be aware that only request from the section **Base Operations** that use an **Base-Token** for the authentication are allowed to use.`,
                type: "string",
            },
            {
                key: "alert",
                type: "copy",
                helpText: "The Authentication header is included automatically.",
            },
            {
                key: "querys",
                label: "Query String Parameters",
                helpText: "These params will be URL-encoded and appended to the URL when making the request.",
                dict: true,
            },
            /*{
                key: "headers",
                label: "Additional Request Headers",
                helpText: "Zapier will apply these optional headers and values to the request in addition to any headers created as part of the authentication mechanism.",
                dict: true,
            },*/
            {
                key: "body",
                required: false,
                label: "Body",
                helpText: "Only valid JSON is accepted. Zapier will pass anything you enter as raw input. For example, `{\"foo\", \"bar\"}` is perfectly valid. Of cause you can use variables from Zapier inside your JSON.",
                type: "text",
            },
        ],
        sample: {"success": true},
        outputFields: [{"key": "success", "type": "boolean"}],
    },
  };
