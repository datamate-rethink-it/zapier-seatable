# DEV-2: Authentication against Invalid DTable gives 404

The SeaTable API gives a 404 when claiming an app-access-token for a dtable base that was deleted.

Event is `404 GET https://cloud.seatable.io/api/v2.1/dtable/app-access-token/`.

So far only the 401 and 403 events are handled for the operation within the HTTP Middleware at `handleHTTPError`:

~~~js
  if (response.status === 401) {
    throw new z.errors.RefreshAuthError()
  }
  if (response.status === 403) {
    throw new Error(_CONST.STRINGS['http.error.status403'])
  }
~~~

And the 404 event is there in the fall-through only due to having Status Code 404 (`>= 400`):

~~~js
  throw new Error(`Unexpected status code ${response.status}`)
~~~

The Event HTTP request is emitted in `ctx.acquireDtableAppAccess()`.

- [x] [reproduce in test](../test/ctx-dtableAppAccess.js) (freshly bumped 2.1.3)
- [x] reproduce in zapier

Implementation in [`handleDeletedBaseAccess`](../index.js) to throw `z.errors.ExpiredAuthError` with a decent error message.

From [Stale Authentication Credentials](https://platform.zapier.com/cli_docs/docs#stale-authentication-credentials):

> For apps that require manual refresh of authorization on a regular basis, Zapier provides a mechanism to notify users of expired credentials. With the ExpiredAuthError, the current operation is interrupted, the Zap is turned off (to prevent more calls with expired credentials), and a predefined email is sent out informing the user to refresh the credentials.

- [x] test with cleaning the base from trash (e.g. what if 30 days are over?)

Implementation in [`handleForbiddenBaseAccess`](../index.js) to throw `z.errors.ExpiredAuthError` with a direct error message.

---
## Appendixes

### Test:

#### Common Procedure:

1. create a base
2. add an api key (rw); provide an app-name for the token
3. set up a zap for that base
4. test the zap and save it
5. run the zap
6. delete the base (goes into trash)
7. run the zap -or- wait for the email alert (depending on what to test for)
8. restore the base from trash
9. reconnect the zap

#### Extra Procedure:

1. all the previous
2. copy the base
3. delete the base
4. remove the base from trash
5. run the zap

### Event:

404 GET https://cloud.seatable.io/api/v2.1/dtable/app-access-token/

#### Event details:

- GENERAL
    - ID: b8c68888-3b98-11ed-bd7d-a2192f5e1674
    - Date: 2022-09-23T23:37:43+00:00 (3d, 6h ago)
    - Type: N/A
    - Key: row_create
- REQUEST INFORMATION
    - ID: N/A
    - Method: GET
    - URL/Path: https://cloud.seatable.io/api/v2.1/dtable/app-access-token/
    - Headers:
        - Authorization: Token :censored:40:dbcaaeedaa:
        - Accept: application/json
        - user-agent: Zapier
    - Params: N/A
    - Data: N/A
    - Duration (ms): 399
- RESPONSE INFORMATION
    - Status Code: 404
    - Headers:
        - allow: GET, HEAD, OPTIONS
        - connection: close
        - content-encoding: gzip
        - content-language: en
        - content-type: application/json
        - date: Fri, 23 Sep 2022 23:37:43 GMT
        - server: nginx/1.22.0
        - transfer-encoding: chunked
        - vary: Accept, Accept-Language, Cookie
    - URL/Path: https://cloud.seatable.io/api/v2.1/dtable/app-access-token/
    - Content: {"error_msg":"dtable _(deleted_60049) test1 adf not found."}
