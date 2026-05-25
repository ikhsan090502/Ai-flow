// Native DOMException shim to eliminate npm warning for deprecated node-domexception
module.exports = globalThis.DOMException;
