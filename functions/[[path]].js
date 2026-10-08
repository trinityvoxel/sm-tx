import {handleRequest} from '../.server/entry-server.js';
import assets from '../.server/assets.json';
export function onRequest({request,env}) { return handleRequest(request,env,assets); }
