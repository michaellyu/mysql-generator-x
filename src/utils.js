const utils = {
  isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  },
  isArray(arr) {
    return Array.isArray(arr);
  },
  isString(str) {
    return typeof str === 'string';
  },
};

module.exports = utils;
