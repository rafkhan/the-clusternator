'use strict';

/*global require, module*/

var authorities = require('./authorities');

module.exports = {
    greaterThan: gt,
    lessThan: lt,
    greaterThanEq: gte,
    lessThanEq: lte,
    equalTo: eq,
    validate: validate
};

function validate(a) {
    var offset = authorities.types.indexOf(a);
    if (offset === -1) {
        return authorities.REG;
    }
    return authorities.types[offset];
}

function toNumber(a) {
    var num = authorities.types.indexOf(a);
    if (num === -1) {
        num = 0;
    }
    return num;
}

function gt(a, b) {
    a = toNumber(a);
    b = toNumber(b);

    return a > b;
}

function lt(a, b) {
    a = toNumber(a);
    b = toNumber(b);

    return a < b;
}

function gte(a, b) {
    a = toNumber(a);
    b = toNumber(b);

    return a >= b;
}

function lte(a, b) {
    a = toNumber(a);
    b = toNumber(b);

    return a <= b;
}

function eq(a, b) {
    a = toNumber(a);
    b = toNumber(b);

    return a === b;
}


