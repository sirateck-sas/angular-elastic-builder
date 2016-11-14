/**
 * angular-elastic-builder
 *
 * /src/directives/BuilderDirective.js
 *
 * Angular Directive for injecting a query builder form.
 */

 (function(angular) {
   'use strict';

   angular.module('angular-elastic-builder')
    .directive('elasticBuilder', [
      'elasticQueryService',

      function EB(elasticQueryService) {

        return {
          scope: {
            data: '=elasticBuilder',
          },

          templateUrl: 'angular-elastic-builder/BuilderDirective.html',

          link: function(scope) {
            var data = scope.data;

            //Set Saved data
            if(data.filters) scope.filters = data.filters;

            /**
             * Removes either Group or Rule
             */
            scope.removeChild = function(idx) {
              scope.filters.splice(idx, 1);
            };

            /**
             * Adds a Single Rule
             */
            scope.addRule = function() {
              scope.filters.push({});
            };

            /**
             * Adds a Group of Rules
             */
            scope.addGroup = function() {
              var newGroup = {
                type: 'group',
                subType: 'bool',
                rules: [{
                  type: 'group',
                  subType: 'must',
                  rules: [],
                }],
              };
              scope.filters.push(newGroup);

            };

            /**
             * Any time "outside forces" change the query, they should tell us so via
             * `data.needsUpdate`
             */
            scope.$watch('data.needsUpdate', function(curr) {
              if (!curr) return;
              scope.filters = elasticQueryService.toFilters(data.query, scope.data.fields);

              scope.data.needsUpdate = false;
            });

            /**
             * Changes on the page update the Query
             */
            scope.$watch('filters', function(curr) {
              if (!curr) return;
              var query = elasticQueryService.toQuery(scope.filters, scope.data.fields);
              data.query = query;
            }, true);
          },
        };
      },

    ]);

 })(window.angular);
