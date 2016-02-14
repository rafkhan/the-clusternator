'use strict';

const rewire = require('rewire');
const Q = require('q');
const mockSpawn = require('mock-spawn');

const gpg = rewire('./gpg');
const cproc = rewire('./child-process');
const C = require('./../chai');

/*global describe, it, expect, beforeEach, afterEach */
describe('Test GPG CLI Wrapper', () => {
  let cProc;

  beforeEach(() => {
    cProc = gpg.__get__('cproc');
    gpg.__set__('cproc', {output: Q.resolve, stream: Q.resolve});
  });

  afterEach(() => {
    gpg.__set__('cproc', cProc);
  });

  it('encrypt should reject if passphrase is shorter than thirty chars',
    (done) => {
      gpg.encrypt('12345678901234567890123456789', 'some text').
      then(C.getFail(done), (err) => {
        C.check(done, () => {
          expect(err instanceof Error).to.be.true;
        });
      });
    });

  it('encryptFile should reject if passphrase is shorter than thirty chars',
    (done) => {
      gpg.encryptFile('12345678901234567890123456789', 'filePath').
      then(C.getFail(done), (err) => {
        C.check(done, () => {
          expect(err instanceof Error).to.be.true;
        });
      });
    });


  describe('Test GPG CLI Passing (not stdout)', () => {
    beforeEach(() => {
      const ms = mockSpawn();
      ms.setDefault(ms.simple(0, ''));
      cproc.__set__('spawn', ms);
    });

    it('encryptFile should resolve if the spawned command resolves', (done) => {
      gpg.encryptFile('some-super-secret-and-long-pass', 'filePath').
      then(() => {
        C.check(done, () => {
          expect(true).to.be.ok;
        });
      }, C.getFail(done));
    });

    it('decryptFile should resolve if the spawned command resolves', (done) => {
      gpg.decryptFile('some-super-secret-and-long-pass', 'cipherPath', 'out').
      then(() => {
        C.check(done, () => {
          expect(true).to.be.ok;
        });
      }, C.getFail(done));
    });
  });

});
