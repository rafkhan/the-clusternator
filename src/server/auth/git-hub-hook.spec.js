'use strict';

const Q = require('q');
const C = require('../../chai');
const rewire = require('rewire');
const gh = rewire('./git-hub-hook');
const crypto = require('crypto');

function hmac(key, text) {
  const h = crypto.createHmac('sha1', key);
  h.setEncoding('hex');
  h.write(text);
  h.end();
  const hash = 'sha1=' + h.read();
  return hash;
}

/*global describe, it, expect, beforeEach, afterEach */
describe('Passwords interface', function () {
  // for this.timeout to work this describe block CANNOT use an arrow
  this.timeout(10000);

  describe('checkHmac function', () => {
    it('should return true if an hmac matches', () => {
      expect(gh.checkHmac('signed', 'text', hmac('signed', 'text')) === true)
        .to.be.ok;
    });

    it('should return false if an hmac does not match', () => {
      expect(gh.checkHmac('not signed', 'text', hmac('signed', 'text')))
      .not.to.be.ok;
    });
  });

  describe('middlewareFactory function', () => {
    it('should return a function', () => {
      const fn = gh();
      expect(typeof fn === 'function').to.be.ok;
    });
  });

  describe('middleware function', () => {
    let getData;
    let jsonData;
    let req;
    let res;

    beforeEach(() => {
      getData = hmac('signed', 'text');
      req = {
        body: {
          repository: {
            name: 'test project'
          }
        },
        get: () => getData,
        rawBody: 'text'
      };
      res = {
        locals: {},
        status: () =>  {
          return {
            json: (d) => jsonData = d
          };
        }
      };
    });

    it('should resolve an error object if signature not found in headers',
      () => {
        req.get = () => false;
        const mw = gh();
        mw(req, res);
        expect(jsonData.error).to.be.ok;
      });

    it('should resolve an error if the database rejects', (done) => {
      const mw = gh(() => () => Q.reject(new Error('test')));
      mw(req, res).then(() => C
         .check(done, () => expect(jsonData.error).to.be.ok), C.getFail(done));
    });

    it('should resolve an error if hmacs mismatch', (done) => {
       const mw = gh(() => () => Q.resolve({ gitHubKey: 'invalid' }));
       mw(req, res).then(() => C
         .check(done, () => expect(jsonData.error).to.be.ok), C.getFail(done));
    });

    it('should call next if everything is okay', (done) => {
      const mw = gh(() => () => Q.resolve({ gitHubKey: 'signed' }));
      let ran = false;
      mw(req, res, () => ran = true)
        .then(() => C
          .check(done, () => expect(ran).to.be.ok), C.getFail(done));
    });
  });
});
