'use strict';

const Q = require('q');
const rewire = require('rewire');

const p = rewire('./project-db');
const C = require('../../../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('CLI Cloud Services', () => {
  let oldCn;
  let projects = [];
  let fns = [
    'createData', 'resetAuth', 'resetShared', 'resetGitHub', 'getShared',
    'getGitHub'
  ];
  beforeEach(() => {
    p.__set__('cn', {
      createProjectData: () => projects instanceof Error ?
        Q.reject(projects) : Q.resolve(projects),
      resetProjectShared: () => projects instanceof Error ?
        Q.reject(projects) : Q.resolve(projects),
      resetProjectGitHub: () => projects instanceof Error ?
        Q.reject(projects) : Q.resolve(projects),
      resetProjectAuth: () => projects instanceof Error ?
        Q.reject(projects) : Q.resolve(projects),
      getProjectGitHub: () => projects instanceof Error ?
        Q.reject(projects) : Q.resolve(projects),
      getProjectShared: () => projects instanceof Error ?
        Q.reject(projects) : Q.resolve(projects)
    });
  });

  afterEach(() => {
    p.__set__('cn', oldCn);
    projects = [];
  });

  fns.forEach((fn) => {
    it(`${fn} should resolve if clusternator API resolves`, (done) => {
      C.check(p[fn], done);
    });

    it(`${fn} should swallow rejections if clusternator API rejects ` +
      '(CLI Endpoint)', (done) => {
      projects  = new Error('test');
      C.check(p[fn], done);
    });

  });


});
