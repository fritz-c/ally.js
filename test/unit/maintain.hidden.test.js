define(function(require) {
  'use strict';

  var registerSuite = require('intern!object');
  var expect = require('intern/chai!expect');
  var customFixture = require('../helper/fixtures/custom.fixture');
  var maintainHidden = require('ally/maintain/hidden');

  registerSuite(function() {
    var fixture;
    var handle;
    var handle2;

    return {
      name: 'maintain/hidden',

      beforeEach: function() {
        fixture = customFixture([
          /*eslint-disable indent */
          '<div id="uncle-1">',
            '<div id="cousin-1"></div>',
          '</div>',
          '<div id="family">',
            '<div id="parent">',
              '<div id="target"></div>',
              '<div id="sibling"></div>',
            '</div>',
            '<div id="uncle-2">',
              '<div id="cousin-2"></div>',
              '<div id="target-2"></div>',
            '</div>',
          '</div>',
          /*eslint-disable indent */
        ]);
      },
      afterEach: function() {
        // make sure a failed test cannot leave listeners behind
        handle && handle.disengage({ force: true });
        handle2 && handle2.disengage({ force: true });
        fixture.remove();
        fixture = null;
      },

      lifecycle: function() {
        var uncle1 = document.getElementById('uncle-1');
        expect(uncle1.hasAttribute('aria-hidden')).to.equal(false, 'uncle-1 before engaged');

        handle = maintainHidden({
          filter: '#target',
        });
        expect(handle.disengage).to.be.a('function');
        expect(fixture.root.hasAttribute('aria-hidden')).to.equal(false, 'root after engaged');
        expect(uncle1.getAttribute('aria-hidden')).to.equal('true', 'uncle-1 after engaged');

        handle.disengage();
        expect(uncle1.hasAttribute('aria-hidden')).to.equal(false, 'uncle-1 after disengaged');
      },
      context: function() {
        var sibling = document.getElementById('sibling');
        var cousin2 = document.getElementById('cousin-2');
        expect(sibling.hasAttribute('aria-hidden')).to.equal(false, 'sibling before engaged');
        expect(cousin2.hasAttribute('aria-hidden')).to.equal(false, 'cousin-2 before engaged');

        handle = maintainHidden({
          context: '#family',
          filter: '#target, #target-2',
        });
        expect(fixture.root.hasAttribute('aria-hidden')).to.equal(false, 'root after engaged');
        expect(sibling.getAttribute('aria-hidden')).to.equal('true', 'sibling after engaged');
        expect(cousin2.getAttribute('aria-hidden')).to.equal('true', 'cousin-2 after engaged');

        handle.disengage();
        expect(sibling.hasAttribute('aria-hidden')).to.equal(false, 'sibling after disengaged');
        expect(cousin2.hasAttribute('aria-hidden')).to.equal(false, 'cousin-2 after disengaged');
      },
      'mutation: adding uncle': function() {
        if (!window.MutationObserver) {
          this.skip('MutationObserver not supported');
        }

        var deferred = this.async(10000);

        handle = maintainHidden({
          context: fixture.root,
          filter: '#target',
        });

        var dynamic = fixture.add('<div></div>');
        // dom mutation is observed asynchronously
        setTimeout(deferred.callback(function() {
          expect(dynamic.getAttribute('aria-hidden')).to.equal('true', 'dynamic after the fact');

          handle.disengage();
          expect(dynamic.hasAttribute('aria-hidden')).to.equal(false, 'dynamic after disengaged');
        }), 50);
      },
      'mutation: adding child': function() {
        if (!window.MutationObserver) {
          this.skip('MutationObserver not supported');
        }

        var deferred = this.async(10000);

        handle = maintainHidden({
          context: fixture.root,
          filter: '#target',
        });

        var dynamic = document.createElement('div');
        var target = document.getElementById('target');
        target.appendChild(dynamic);
        // dom mutation is observed asynchronously
        setTimeout(deferred.callback(function() {
          expect(dynamic.hasAttribute('aria-hidden')).to.equal(false, 'dynamic after the fact');

          handle.disengage();
          expect(dynamic.hasAttribute('aria-hidden')).to.equal(false, 'dynamic after disengaged');
        }), 50);
      },
      'mutation: adding cousin': function() {
        if (!window.MutationObserver) {
          this.skip('MutationObserver not supported');
        }

        var deferred = this.async(10000);

        handle = maintainHidden({
          context: fixture.root,
          filter: '#target',
        });

        var dynamic = document.createElement('div');
        var target = document.getElementById('uncle-2');
        target.appendChild(dynamic);
        // dom mutation is observed asynchronously
        setTimeout(deferred.callback(function() {
          expect(dynamic.hasAttribute('aria-hidden')).to.equal(false, 'dynamic after the fact');

          handle.disengage();
          expect(dynamic.hasAttribute('aria-hidden')).to.equal(false, 'dynamic after disengaged');
        }), 50);
      },
      'concurrent instances': function() {
        var container = fixture.add('<div id="dynamic-sibling"></div><div id="dynamic-target"></div>', 'dynamic-wrapper');
        var dynamicSibling = document.getElementById('dynamic-sibling');
        var sibling = document.getElementById('sibling');

        handle = maintainHidden({
          context: '#family',
          filter: '#target',
        });
        expect(sibling.getAttribute('aria-hidden')).to.equal('true', 'sibling after first handle');
        expect(dynamicSibling.hasAttribute('aria-hidden')).to.equal(false, 'dynamic-sibling after first handle');

        handle2 = maintainHidden({
          context: container,
          filter: '#dynamic-target',
        });
        expect(sibling.getAttribute('aria-hidden')).to.equal('true', 'sibling after second handle');
        expect(dynamicSibling.getAttribute('aria-hidden')).to.equal('true', 'dynamic-sibling after second handle');

        handle.disengage();
        expect(sibling.hasAttribute('aria-hidden')).to.equal(false, 'sibling after disengaged first handle');
        expect(dynamicSibling.getAttribute('aria-hidden')).to.equal('true', 'dynamic-sibling after disengaged first handle');
      },
    };
  });
});
