'use strict';

const Q = require('q');
const rewire = require('rewire');

const au = rewire('./aws-util');
const C = require('../chai');

const aws = {};

function initData() {}


/*global describe, it, expect, beforeEach, afterEach */
describe('AWS: utility functions', () => {

  beforeEach(initData);
  
  describe('bindAws function', () => {
    it('should throw without a target object', () => {
      expect(() => au.bindAws(aws)).to.throw(TypeError);
    });
    it('should return a copy of the api bound with an aws object', () => {
      let testAws = false;
      const verboseApi = { test: (aws) => { testAws = aws ? true : false; }};
      au.bindAws(aws, verboseApi).test();
      expect(testAws).to.equal(true); 
    });
    
    it('should preserve non-functions on API', () => {
      const verboseApi = { test: () => {}, direct: 'direct' };
      expect(au.bindAws(aws, verboseApi).direct).to.equal('direct');
    });
    
    it('should skip binding function keys named bindAws', () => {
      let testAws = false;
      let called = false;
      const verboseApi = {
        test: (aws) => {
          testAws = aws ? true : false;
        },
        bindAws: () => { called = true; }};
      const api = au.bindAws(aws, verboseApi);
      api.bindAws(aws, verboseApi);
      expect(testAws).to.equal(false); 
      expect(called).to.equal(true);
    });
  });
});
