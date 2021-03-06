/* Add HTML + CSS to setup page for functional testing */
require('../helper').loadAssets();

/* Require file to test */
var local = {}; local['{{ component }}'] = require('../../src/scripts/{{ component }}');

/* Start Test */
describe('{{ component }} module can ', function () {

    it('sum an array of numbers', function () {

        expect(new local['{{ component }}']().sum([1,2,3])).toBe(6);

    });

    it('version is attached', function () {

        expect(new local['{{ component }}']().version).toBe('0.0.0');

    });

});