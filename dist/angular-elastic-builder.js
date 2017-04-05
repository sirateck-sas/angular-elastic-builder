/**
 * # angular-elastic-builder
 * ## Angular Module for building an Elasticsearch Query
 *
 * @version v1.5.1
 * @link https://github.com/sirateck-sas/angular-elastic-builder.git
 * @license MIT
 * @author Dan Crews <crewsd@gmail.com>
 */

/**
 * angular-elastic-builder
 *
 * /src/module.js
 *
 * Angular Module for building an Elasticsearch query
 */

(function(angular) {
  'use strict';

  angular.module('angular-elastic-builder', [
    'RecursionHelper',
    'ui.bootstrap',
  ]);

})(window.angular);

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

/**
 * angular-elastic-builder
 *
 * /src/directives/Chooser.js
 *
 * This file is to help recursively, to decide whether to show a group or rule
 */

(function(angular) {
  'use strict';

  var app = angular.module('angular-elastic-builder');

  app.directive('elasticBuilderChooser', [
    'RecursionHelper',
    'groupClassHelper',

    function elasticBuilderChooser(RH, groupClassHelper) {

      return {
        scope: {
          elasticFields: '=',
          item: '=elasticBuilderChooser',
          onRemove: '&',
        },

        templateUrl: 'angular-elastic-builder/ChooserDirective.html',

        compile: function (element) {
          return RH.compile(element, function(scope, el, attrs) {
            var depth = scope.depth = (+attrs.depth)
              , item = scope.item;

            scope.getGroupClassName = function() {
              var level = depth;
              if (item.type === 'group') level++;

              return groupClassHelper(level);
            };
          });
        },
      };
    },

  ]);

})(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/directives/Group.js
 */

(function(angular) {
  'use strict';

  var app = angular.module('angular-elastic-builder');

  app.directive('elasticBuilderGroup', [
    'RecursionHelper',
    'groupClassHelper',

    function elasticBuilderGroup(RH, groupClassHelper) {

      return {
        scope: {
          elasticFields: '=',
          group: '=elasticBuilderGroup',
          onRemove: '&',
        },

        templateUrl: 'angular-elastic-builder/GroupDirective.html',

        compile: function(element) {
          return RH.compile(element, function(scope, el, attrs) {
            var depth = scope.depth = (+attrs.depth);
            var group = scope.group;

            scope.addRule = function() {
              group.rules.push({});
            };
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

              if(group.subType == 'bool') newGroup = {
                    type: 'group',
                    subType: 'must',
                    rules: [],
                  };

              group.rules.push(newGroup);
            }

            scope.removeChild = function(idx) {
              group.rules.splice(idx, 1);
            };

            scope.getGroupClassName = function() {
              return groupClassHelper(depth + 1);
            };
          });
        },
      };
    },

  ]);

})(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/directives/Rule.js
 */

(function(angular) {
  'use strict';

  var app = angular.module('angular-elastic-builder');

  app.directive('elasticBuilderRule', [

    function elasticBuilderRule() {
      return {
        scope: {
          elasticFields: '=',
          rule: '=elasticBuilderRule',
          onRemove: '&',
        },

        templateUrl: 'angular-elastic-builder/RuleDirective.html',

        link: function(scope) {
          scope.getType = function() {
            var fields = scope.elasticFields
              , field = scope.rule.field;

            if (!fields || !field) return;

            if(!field.options) field.options = [];

            if (field.subType === 'boolean') return 'boolean';

            return field.type;
          };
        },
      };
    },

  ]);

})(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/directives/RuleTypes.js
 *
 * Determines which Rule type should be displayed
 */

(function(angular) {
  'use strict';

  var app = angular.module('angular-elastic-builder');

  app.directive('elasticType', [

    function() {
      return {
        scope: {
          type: '=elasticType',
          rule: '=',
          guide: '='
        },

        template: '<ng-include src="getTemplateUrl()" />',

        link: function(scope) {
          scope.getTemplateUrl = function() {
            var type = scope.type;
            if (!type) return;

            type = type.charAt(0).toUpperCase() + type.slice(1);

            return 'angular-elastic-builder/types/' + type + '.html';
          };

          scope.isSelect = function(){
            return !scope.guide.nested && scope.guide.options.length && (scope.rule.subType == 'notEquals' || scope.rule.subType == 'equals');
          }
          scope.isObject = function(){
            return scope.guide.object && scope.guide.options.length;
          }

          scope.isNested = function(){
            return scope.guide.nested && scope.guide.options.length && (scope.rule.subType == 'notEquals' || scope.rule.subType == 'equals');
          }

          scope.keyValueChanged = function(keyValue){

              if(!keyValue) return;

              var options = scope.guide.options.filter(function(opt){
                  return opt[scope.guide.fieldKey] == scope.rule.valueKey;
              })

              if(options.length){
                var values = options[0][scope.guide.fieldValue];
                scope.rule[scope.guide.fieldValue] = values;
              }
          };


          // This is a weird hack to make sure these are numbers
          scope.booleans = [ 'False', 'True' ];
          scope.booleansOrder = [ 'True', 'False' ];

          scope.inputNeeded = function() {
            var needs = [
              'equals',
              'notEquals',
              'match_phrase',
              'gt',
              'gte',
              'lt',
              'lte',
            ];

            return ~needs.indexOf(scope.rule.subType) || (scope.rule.subType === 'match' && scope.guide.object);
          };

          scope.inputPercentNeeded = function() {
            var needs = [
              'match'
            ];

            return ~needs.indexOf(scope.rule.subType);
          };

          scope.numberNeeded = function() {
            var needs = [
              'last',
              'next',
            ];

            return ~needs.indexOf(scope.rule.subType);
          };

          scope.today = function() {
            scope.rule.date = new Date();
          };
          scope.today();

          scope.clear = function() {
            scope.rule.date = null;
          };

          scope.dateOptions = {
            dateDisabled: disabled,
            formatYear: 'yy',
            maxDate: new Date(2018, 1, 13),
            minDate: new Date(),
            startingDay: 1,
          };

          // Disable weekend selection
          function disabled(data) {
            var date = data.date
              , mode = data.mode;
            return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
          }

          scope.open1 = function() {
            scope.popup1.opened = true;
          };

          scope.setDate = function(year, month, day) {
            scope.rule.date = new Date(year, month - 1, day);
          };

          scope.formats = [
            'yyyy-MM-ddTHH:mm:ss',
            'yyyy-MM-ddTHH:mm:ssZ',
            'yyyy-MM-dd',
            'dd-MMMM-yyyy',
            'yyyy/MM/dd',
            'shortDate',
          ];
          scope.rule.dateFormat = scope.formats[0];
          scope.format = scope.rule.dateFormat;

          scope.altInputFormats = ['M!/d!/yyyy'];

          scope.popup1 = { opened: false };
        },

      };
    },

  ]);

})(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/services/GroupClassHelper.js
 *
 * This keeps all of the groups colored correctly
 */

(function(angular) {
  'use strict';

  angular.module('angular-elastic-builder')
    .factory('groupClassHelper', function groupClassHelper() {

      return function(level) {
        var levels = [
          '',
          'list-group-item-info',
          'list-group-item-success',
          'list-group-item-warning',
          'list-group-item-danger',
        ];

        return levels[level % levels.length];
      };
    });

})(window.angular);

/**
 * angular-elastic-builder
 *
 * /src/services/QueryService.js
 *
 * This file is used to convert filters into queries, and vice versa
 */

(function(angular) {
  'use strict';

  angular.module('angular-elastic-builder')
    .factory('elasticQueryService', [
      '$filter',

      function($filter) {

        return {
          toFilters: toFilters,
          toQuery: function(filters, fieldMap) {
            return toQuery(filters, fieldMap, $filter);
          },
        };
      },
    ]);

  function toFilters(query, fieldMap){
    var q = [];
    var cleanQuery = {};

    //Remove nested depth
    if(query.nested){
        cleanQuery = query.nested.query;
    }
    else{
      cleanQuery = query;
    }

    //Transform query into an array
    Object.keys(cleanQuery).forEach(function(key){
      var o = {};
      o[key] =  cleanQuery[key];
      q.push(o);
    });

    var filters = q.map(parseQueryGroup.bind(q, fieldMap)).filter(function(item){
      return !!item;
    });

    return filters;
  }
  // Construct a BOOL Query
  // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html
  function toQuery(filters, fieldMap, $filter){

    //If user create an existing group, we merge rules into unique group
    /*var mergedFilters = {};
    filters.forEach(function(filter){
      console.log('filter',filter);
      if(filter.type == 'group'){
        if(!mergedFilters[filter.subType]){
           mergedFilters[filter.subType] = filter;
        }
        else{
          filter.rules.forEach(function(rule){
              var exists = mergedFilters[filter.subType].rules.find(function(f){
                  return angular.equals(f,rule);
              });
              if(!exists) mergedFilters[filter.subType].rules.push(rule);
          });

        }
      }

    });
    console.log("merged filters",mergedFilters);
    filters = Object.values(mergedFilters);
    console.log("merged filters values",filters);*/

    var query = filters.map(parseFilterGroup.bind(filters, fieldMap, $filter)).filter(function(item) {
      return !!item;
    });

    var searchNestedField = function(filters){
      var fieldNested = null;
      filters.forEach(function(filter){
        if(!filter.field && filter.rules && filter.rules.length){
          fieldNested = searchNestedField(filter.rules);
        }

        if(filter.field && filter.field.nested){ //We have a nested field at least
          fieldNested = filter.field;
          return fieldNested;
        }
      });

      return fieldNested;
    };

    var obj = {};

     query.forEach(function(q){
        Object.keys(q).forEach(function(key){
          obj[key] = q[key];
        });
      });

    var fieldNested = searchNestedField(filters);

    if(fieldNested){
      obj = {
          nested: {
            path: fieldNested.nestedPath || fieldNested.name,
            query: {bool: obj.bool},
          }
      };
    }

    return obj;

  }


  function parseQueryGroup(fieldMap, group, truthy) {
    if (truthy !== false) truthy = true;

    var key = Object.keys(group)[0]
      , typeMap = {
        bool: 'group',
        must: 'group',
        should: 'group',
        must_not: 'group',
        filter: 'group',
        range: 'number',
      }
      , type = typeMap[key] || 'item'
      , obj = getFilterTemplate(type);

      //Little hack to process match key as term
      var fieldNameTmp = Object.keys(group[key])[0];
      if(key === 'match' && !group[key][fieldNameTmp].minimum_should_match){
        key = 'term';
      }

    switch (key) {
      case 'bool':
          //Transform fo array
          var rules = [];

          Object.keys(group[key]).forEach(function(subkey){
            var o = {};
            o[subkey] =  group[key][subkey];
            rules.push(o);
          });

          obj.rules = rules.map(parseQueryGroup.bind(group, fieldMap));
          obj.subType = key;
        break;
      case 'should':
      case 'must':
      case 'must_not':
      case 'filter':
        obj.rules = group[key].map(parseQueryGroup.bind(group, fieldMap));
        obj.subType = key;
        break;
      case 'missing':
      case 'exists':

        var fieldName = group[key].field;

        var fieldData = fieldMap.filter(function(f){
          return f.name == fieldName;
        });

        if(!fieldData.length) {console.log("No fieldData",fieldMap);return {};}

        obj.field = fieldData[0];

        obj.subType = {
          exists: 'exists',
          missing: 'notExists',
        }[key];
        delete obj.value;
        break;
      case 'match':
      case 'match_phrase':
          var fieldName = Object.keys(group[key])[0]
          var originalFieldName = fieldName;
          var slug_name_value = '';
          if(~originalFieldName.indexOf('.')) {
            var nameSplitted = originalFieldName.split('.');
            fieldName = nameSplitted[0];
            slug_name_value = nameSplitted[1];
          }

          var fieldData = fieldMap.filter(function(f){
            return f.name == fieldName;
          });


          if(!fieldData.length) {console.log("No fieldData",fieldMap);return {};}
          obj.field = fieldData[0];

          if(obj.field.options && obj.field.options.length){

            if(obj.field.object){

              var fieldKey = obj.field.fieldKey || 'name';
              var fieldValue = obj.field.fieldValue || 'value';
              var fieldKeyPath = fieldName + '.' + fieldKey;
              var fieldValuePath = fieldName + '.' + fieldValue;
              obj.valueKey = slug_name_value;
              obj.subType = key;//'equals';
              obj.field.options.forEach(function(o){
                if(o.name ==  obj.valueKey) {
                  obj[fieldValue] = o[fieldValue];
                }
              });

            }

             obj.matchingPercent = parseInt(group[key][originalFieldName].minimum_should_match.slice(0, -1));
             obj.operator = group[key][originalFieldName].operator;

          }
          else{
            if(key != 'match'){
                 obj.value = group[key][fieldName].slop;
             }
             else{

               obj.matchingPercent = parseInt(group[key][originalFieldName].minimum_should_match.slice(0, -1));
               obj.operator = group[key][originalFieldName].operator;
             }

             obj.subType = key;
          }



        break;
      case 'term':
      case 'terms':

      //little hack :-(
      if(!group[key]) key = 'match';


        var originalFieldName = Object.keys(group[key])[0];
        var fieldName = originalFieldName;
        if(~originalFieldName.indexOf('.')) {
          fieldName = fieldName.split('.')[0];
        }

        var fieldData = fieldMap.filter(function(f){
          return f.name == fieldName;
        });


        if(!fieldData.length) {console.log("No fieldData",fieldMap);return {};}

        obj.field = fieldData[0];


        if (obj.field.type === 'multi') {
          var vals = group[key][fieldName];
          if (typeof vals === 'string') vals = [ vals ];
          obj.values = obj.field.choices.reduce(function(prev, choice) {
            prev[choice] = group[key][fieldName].indexOf(choice) !== -1;
            return prev;
          }, {});
        }
        else if(obj.field.options && obj.field.options.length){

          if(obj.field.nested){
            var fieldKey = obj.field.fieldKey || 'name';
            var fieldValue = obj.field.fieldValue || 'value';
            var fieldKeyPath = fieldName + '.' + fieldKey;
            var fieldValuePath = fieldName + '.' + fieldValue;
            obj.valueKey = group[key][fieldKeyPath];
            obj.value = group[key][fieldValuePath];
            obj.subType = 'equals';
            obj.field.options.forEach(function(o){
              if(o.name ==  obj.valueKey) {
                obj[fieldValue] = o[fieldValue];
              }
            });

            //search value key
            if(!obj.valueKey && obj.value){
              var valueKey = '';
                obj.field.options.forEach(function(o){

                  o[fieldValue].forEach(function(v){
                    if(v == obj.value) {
                      obj.valueKey = o[fieldKey];
                      obj[fieldValue] = o[fieldValue];
                      return;
                    }
                    return;
                  });
                  if(obj.valueKey) return;

                  });
            }

          }
          else{
              obj.value = group[key][fieldName];
              obj.subType = 'equals';
          }

        }
        else {
          obj.subType = truthy ? 'equals' : 'notEquals';
          obj.value = group[key][fieldName];

          if (typeof obj.value === 'number') {
            obj.subType = 'boolean';
          }
        }
        break;
      case 'range':
        var date, parts;
        var fieldName = Object.keys(group[key])[0];
        var fieldData = fieldMap.filter(function(f){
          return f.name == fieldName;
        });

        if(!fieldData.length) {console.log("No fieldData",fieldMap);return {};}

        obj.field = fieldData[0];

        //obj.field = Object.keys(group[key])[0];
        obj.subType = Object.keys(group[key][fieldName])[0];

        if (angular.isNumber(group[key][fieldName][obj.subType])) {
          obj.value = group[key][fieldName][obj.subType];
          break;
        }

        if (angular.isDefined(Object.keys(group[key][fieldName])[1])) {
          date = group[key][fieldName].gte;

          if (~date.indexOf('now-')) {
            obj.subType = 'last';
            obj.value = parseInt(date.split('now-')[1].split('d')[0]);
            break;
          }

          if (~date.indexOf('now')) {
            obj.subType = 'next';
            date = group[key][fieldName].lte;
            obj.value = parseInt(date.split('now+')[1].split('d')[0]);
            break;
          }

          obj.subType = 'equals';
          parts = date.split('T')[0].split('-');
          obj.date = parts[2] + '/' + parts[1] + '/' + parts[0];
          break;
        }

        date = group[key][fieldName][obj.subType];
        parts = date.split('T')[0].split('-');
        obj.date = parts[2] + '/' + parts[1] + '/' + parts[0];
        break;

      case 'not':
        obj = parseQueryGroup(fieldMap, group[key].filter, false);
        break;
      default:
        obj.field = Object.keys(group[key])[0];
        break;
    }

    return obj;
  }

  function parseFilterGroup(fieldMap, $filter, group) {
    var obj = {};
    if (group.type === 'group') {
      obj = {};

      if(group.subType === 'bool'){
        var rules = (group.rules.map(parseFilterGroup.bind(group, fieldMap, $filter)).filter(function(item) {
          return !!item;
        }));

        obj[group.subType] = {}

        rules.forEach(function(rule){
          obj[group.subType][Object.keys(rule)[0]] = rule[Object.keys(rule)[0]];
        });

        return obj;
      }

      obj[group.subType] = (group.rules.map(parseFilterGroup.bind(group, fieldMap, $filter)).filter(function(item) {
        return !!item;
      }));

      return obj;
    }

    var field = group.field;
    var fieldData = fieldMap.find(function(elmt){
      if(typeof field == "object") {
        return angular.equals(elmt,field);
      }
      else{
        return elmt.name == field;
      }


    });

    if(!fieldData) return;

    var fieldName = fieldData.name
    if (!fieldName) return;

    switch (fieldData.type) {
      case 'term':
        if (fieldData.subType === 'boolean') group.subType = 'boolean';

        if (!group.subType) return;
        switch (group.subType) {
          case 'equals':
          case 'boolean':
            if (!fieldData.nested && !group.value === undefined) return;


            if(fieldData.nested){
              obj.match = {};

             //var nestedPath = fieldData.nestedPath || fieldName;
              var fieldKey = fieldData.fieldKey || 'name';
              var fieldValue = fieldData.fieldValue || 'value';
              var fieldKeyPath = fieldName + '.' + fieldKey;
              var fieldValuePath = fieldName + '.' + fieldValue
              if(group.value)
              {
                obj.match[fieldValuePath]  = group.value;
              }
              else{
                obj.match[fieldKeyPath]  = group.valueKey;
              }


            }
            else{
              obj.match = {};
              obj.match[fieldName] = group.value;
            }

            break;
          case 'notEquals':
            if (group.value === undefined) return;
            obj.not = { filter: { term: {}}};
            obj.not.filter.term[fieldName] = group.value;
            break;
          case 'exists':
            obj.exists = { field: fieldName };
            break;
          case 'notExists':
            if (group.value === undefined) return;
            obj.missing = { field: fieldName };
            break;
          case 'match':

            if (group.matchingPercent === undefined) return;
            obj = { match:{}};
            if(fieldData.object){
              obj.match = {};

             //var nestedPath = fieldData.nestedPath || fieldName;
              var fieldKey = fieldData.fieldKey || 'name';
              var fieldValue = fieldData.fieldValue || 'value';
              var fieldKeyPath = fieldName + '.' + fieldKey;
              var fieldValuePath = fieldName + '.' + fieldValue
              if(group.value)
              {
                obj.match[fieldValuePath]  = group.value;
              }
              else{
                var newFieldName = fieldName + '.' + group.valueKey + '.' + fieldValue;
                obj.match[newFieldName] = {}
                obj.match[newFieldName]['query'] = "%" + newFieldName + "%"; //used for template engine
                obj.match[newFieldName]['minimum_should_match'] = group.matchingPercent + "%";
                obj.match[newFieldName]['operator'] = group.operator;
              }


            }
            else{
              obj.match[fieldName] = {}
              obj.match[fieldName]['query'] = "%" + fieldName + "%"; //used for template engine
              obj.match[fieldName]['minimum_should_match'] = group.matchingPercent + "%";
              obj.match[fieldName]['operator'] = group.operator;
            }


            break;
          case "match_phrase":
            if (group.value === undefined) return;
            obj = { match_phrase:{}};
            obj.match_phrase[fieldName] = {}
            obj.match_phrase[fieldName]['query'] = "%" + fieldName + "%"; //used for template engine
            obj.match_phrase[fieldName]['slop'] = group.value;

            break;
          default:
            throw new Error('unexpected subtype ' + group.subType);
        }
        break;

      case 'number':
        obj.range = {};
        obj.range[fieldName] = {};
        obj.range[fieldName][group.subType] = group.value;
        break;

      case 'date':
        if (!group.subType) return;

        switch (group.subType) {
          case 'equals':
            if (!angular.isDate(group.date)) return;
            obj.term = {};
            obj.term[fieldName] = formatDate($filter, group.date, group.dateFormat);
            break;
          case 'lt':
          case 'lte':
            if (!angular.isDate(group.date)) return;
            obj.range = {};
            obj.range[fieldName] = {};
            obj.range[fieldName][group.subType] = formatDate($filter, group.date, group.dateFormat);
            break;
          case 'gt':
          case 'gte':
            if (!angular.isDate(group.date)) return;
            obj.range = {};
            obj.range[fieldName] = {};
            obj.range[fieldName][group.subType] = formatDate($filter, group.date, group.dateFormat);
            break;
          case 'last':
            if (!angular.isNumber(group.value)) return;
            obj.range = {};
            obj.range[fieldName] = {};
            obj.range[fieldName].gte = 'now-' + group.value + 'd';
            obj.range[fieldName].lte = 'now';
            break;
          case 'next':
            if (!angular.isNumber(group.value)) return;
            obj.range = {};
            obj.range[fieldName] = {};
            obj.range[fieldName].gte = 'now';
            obj.range[fieldName].lte = 'now+' + group.value + 'd';
            break;
          case 'exists':
            obj.exists = { field: fieldName };
            break;
          case 'notExists':
            obj.missing = { field: fieldName };
            break;
          default:
            throw new Error('unexpected subtype ' + group.subType);
        }
        break;

      case 'multi':
        obj.terms = {};
        obj.terms[fieldName] = Object.keys(group.values || {}).reduce(function(prev, key) {
          if (group.values[key]) prev.push(key);

          return prev;
        }, []);
        break;

      default:
        throw new Error('unexpected type');
    }

    return obj;
  }

  function getFilterTemplate(type) {
    var templates = {
      group:
      {
        type: 'group',
        subType: '',
        rules: []
      },
      item: {
        field: '',
        subType: '',
        value: '',
      },
      number: {
        field: '',
        subType: '',
        value: null,
      },
    };

    return angular.copy(templates[type]);
  }

  function formatDate($filter, date, dateFormat) {
    if (!angular.isDate(date)) return false;
    var fDate = $filter('date')(date, dateFormat);
    return fDate;
  }

})(window.angular);

(function(angular) {"use strict"; angular.module("angular-elastic-builder").run(["$templateCache", function($templateCache) {$templateCache.put("angular-elastic-builder/BuilderDirective.html","<div class=\"elastic-builder\">\n  <div class=\"filter-panels\">\n    <div class=\"list-group form-inline\">\n      <div\n        data-ng-repeat=\"filter in filters\"\n        data-elastic-builder-chooser=\"filter\"\n        data-elastic-fields=\"data.fields\"\n        data-on-remove=\"removeChild($index)\"\n        data-depth=\"0\"></div>\n        <div class=\"list-group-item actions\">\n        <!--   <a class=\"btn btn-xs btn-primary\" title=\"Add Rule\" data-ng-click=\"addRule()\">\n          <i class=\"fa fa-plus\"></i>\n        </a>-->\n        <a class=\"btn btn-xs btn-primary\" title=\"Add Group\" data-ng-click=\"addGroup()\">\n          <i class=\"fa fa-list\"></i>\n        </a>\n      </div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("angular-elastic-builder/ChooserDirective.html","<div ng-if=\"item.subType != \'bool\'\"\n  class=\"list-group-item elastic-builder-chooser\"\n  data-ng-class=\"getGroupClassName()\">\n\n  <div data-ng-if=\"item.type === \'group\'\"\n    data-elastic-builder-group=\"item\"\n    data-depth=\"{{ depth }}\"\n    data-elastic-fields=\"elasticFields\"\n    data-on-remove=\"onRemove()\"></div>\n\n  <div data-ng-if=\"item.type !== \'group\'\"\n    data-elastic-builder-rule=\"item\"\n    data-elastic-fields=\"elasticFields\"\n    data-on-remove=\"onRemove()\"></div>\n\n</div>\n\n<div ng-if=\"item.subType == \'bool\'\"\n  class=\"list-group-item elastic-builder-chooser\"\n  data-ng-class=\"getGroupClassName()\">\n\n  <div data-ng-if=\"item.type === \'group\'\"\n    data-elastic-builder-group=\"item\"\n    data-depth=\"{{ depth }}\"\n    data-elastic-fields=\"elasticFields\"\n    data-on-remove=\"onRemove()\"></div>\n\n</div>\n");
$templateCache.put("angular-elastic-builder/GroupDirective.html","<div class=\"elastic-builder-group\">\n  <h5 ng-if=\"group.subType != \'bool\'\">\n    <select data-ng-model=\"group.subType\" class=\"form-control\">\n      <option value=\"must\">must</option>\n      <option value=\"must_not\">must_not</option>\n      <option value=\"should\">should</option>\n    </select>\n    Match these conditions\n  </h5>\n\n  <div\n    data-ng-repeat=\"rule in group.rules\"\n    data-elastic-builder-chooser=\"rule\"\n    data-elastic-fields=\"elasticFields\"\n    data-depth=\"{{ +depth + 1 }}\"\n    data-on-remove=\"removeChild($index)\"></div>\n\n  <div class=\"list-group-item actions\" data-ng-class=\"getGroupClassName()\">\n    <a class=\"btn btn-xs btn-primary\" title=\"Add Sub-Rule\" data-ng-click=\"addRule()\">\n      <i class=\"fa fa-plus\"></i>\n    </a>\n    <a class=\"btn btn-xs btn-primary\" title=\"Add Sub-Group\" data-ng-click=\"addGroup()\">\n      <i class=\"fa fa-list\"></i>\n    </a>\n  </div>\n\n  <a class=\"btn btn-xs btn-danger remover\" data-ng-click=\"onRemove()\">\n    <i class=\"fa fa-minus\"></i>\n  </a>\n</div>\n");
$templateCache.put("angular-elastic-builder/RuleDirective.html","<div class=\"elastic-builder-rule\">\n  <select class=\"form-control\" data-ng-model=\"rule.field\" data-ng-options=\"field as field.title for (key,field) in elasticFields track by field.name\"></select>\n\n  <span data-elastic-type=\"getType()\" data-rule=\"rule\" data-guide=\"rule.field\"></span>\n\n  <a class=\"btn btn-xs btn-danger remover\" data-ng-click=\"onRemove()\">\n    <i class=\"fa fa-minus\"></i>\n  </a>\n\n</div>\n");
$templateCache.put("angular-elastic-builder/types/Boolean.html","<span class=\"boolean-rule\">\n  Equals\n\n  <!-- This is a weird hack to make sure these are numbers -->\n  <select\n    data-ng-model=\"rule.value\"\n    class=\"form-control\"\n    data-ng-options=\"booleans.indexOf(choice) as choice for choice in booleansOrder\">\n  </select>\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Date.html","<span class=\"date-rule form-inline\">\n  <select data-ng-model=\"rule.subType\" class=\"form-control\">\n    <optgroup label=\"Exact\">\n      <option value=\"equals\">=</option>\n    </optgroup>\n    <optgroup label=\"Unbounded-range\">\n      <option value=\"lt\">&lt;</option>\n      <option value=\"lte\">&le;</option>\n      <option value=\"gt\">&gt;</option>\n      <option value=\"gte\">&ge;</option>\n    </optgroup>\n    <optgroup label=\"Bounded-range\">\n      <option value=\"last\">In the last</option>\n      <option value=\"next\">In the next</option>\n    </optgroup>\n    <optgroup label=\"Generic\">\n      <option value=\"exists\">Exists</option>\n      <option value=\"notExists\">! Exists</option>\n    </optgroup>\n  </select>\n\n  <div class=\"form-group\">\n    <div class=\"input-group\">\n      <input data-ng-if=\"inputNeeded()\"\n        type=\"text\"\n        class=\"form-control\"\n        data-uib-datepicker-popup=\"{{ rule.dateFormat }}\"\n        data-ng-model=\"rule.date\"\n        data-is-open=\"popup1.opened\"\n        data-datepicker-options=\"dateOptions\"\n        data-ng-required=\"true\"\n        data-close-text=\"Close\" />\n      <div class=\"input-group-btn\">\n        <button type=\"button\" class=\"btn btn-default\" ng-click=\"open1()\" data-ng-if=\"inputNeeded()\">\n          <i class=\"fa fa-calendar\"></i>\n        </button>\n      </div>\n    </div>\n  </div>\n\n  <span class=\"form-inline\">\n    <div class=\"form-group\">\n      <label data-ng-if=\"inputNeeded()\">Format</label>\n      <select\n        class=\"form-control\"\n        data-ng-model=\"rule.dateFormat\"\n        data-ng-if=\"inputNeeded()\"\n        ng-options=\"f for f in formats\"></select>\n    </div>\n  </span>\n\n  <span data-ng-if=\"numberNeeded()\">\n    <input type=\"number\" class=\"form-control\" data-ng-model=\"rule.value\" min=0> days\n  </span>\n\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Multi.html","<span class=\"multi-rule\">\n  <span data-ng-repeat=\"choice in guide.choices\">\n    <label class=\"checkbox\">\n      <input type=\"checkbox\" data-ng-model=\"rule.values[choice]\">\n      {{ choice }}\n    </label>\n  </span>\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Number.html","<span class=\"number-rule\">\n  <select data-ng-model=\"rule.subType\" class=\"form-control\">\n    <optgroup label=\"Numeral\">\n      <option value=\"equals\">=</option>\n      <option value=\"gt\">&gt;</option>\n      <option value=\"gte\">&ge;</option>\n      <option value=\"lt\">&lt;</option>\n      <option value=\"lte\">&le;</option>\n    </optgroup>\n\n    <optgroup label=\"Generic\">\n      <option value=\"exists\">Exists</option>\n      <option value=\"notExists\">! Exists</option>\n    </optgroup>\n  </select>\n\n  <!-- Range Fields -->\n  <input data-ng-if=\"inputNeeded()\"\n    class=\"form-control\"\n    data-ng-model=\"rule.value\"\n    type=\"number\"\n    min=\"{{ guide.minimum }}\"\n    max=\"{{ guide.maximum }}\">\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Select.html","<span class=\"select-rule\">\n  Equals to \n  <select class=\"form-control\" data-ng-model=\"rule.value\">\n      <option  data-ng-repeat=\"option in guide.options\" value=\"{{option}}\">{{option}}</option>\n  </select>\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Term.html","<span class=\"elastic-term\">\n\n  <select data-ng-model=\"rule.subType\" class=\"form-control\">\n\n    <!-- Matching Options -->\n    <optgroup label=\"Matching\">\n      <option value=\"match\">Minimum Should Match (%)</option>\n      <option value=\"match_phrase\">Match Phrase (slop)</option>\n      <!-- <option value=\"notMatch\">! Match</option> -->\n    </optgroup>\n\n    <!-- Term Options -->\n    <optgroup label=\"Text\">\n      <option value=\"equals\">Equals</option>\n      <!-- <option value=\"notEquals\">! Equals</option> -->\n    </optgroup>\n\n    <!-- Generic Options -->\n    <optgroup label=\"Generic\">\n      <option value=\"exists\">Exists</option>\n      <!-- <option value=\"notExists\">! Exists</option> -->\n    </optgroup>\n\n  </select>\n  <input\n    data-ng-if=\"inputNeeded() && !isSelect() && !isNested() && !isObject()\"\n    class=\"form-control\"\n    data-ng-model=\"rule.value\"\n    type=\"text\">\n\n\n    <select data-ng-if=\"inputNeeded() && isSelect()\" class=\"form-control select2\" data-ng-model=\"rule.value\">\n        <option  data-ng-repeat=\"option in guide.options\" value=\"{{option}}\">{{option}}</option>\n    </select>\n\n    <select data-ng-if=\"inputNeeded() && isObject()\" class=\"form-control select2\" data-ng-model=\"rule.valueKey\">\n        <option  data-ng-repeat=\"option in guide.options\" value=\"{{option[guide.fieldKey]}}\">{{option[guide.fieldKey]}}</option>\n    </select>\n\n    <select data-ng-if=\"inputNeeded() && isNested()\" ng-change=\"keyValueChanged(rule.valueKey)\" class=\"form-control select2\" data-ng-model=\"rule.valueKey\">\n        <option  data-ng-repeat=\"option in guide.options\" value=\"{{option[guide.fieldKey]}}\">{{option[guide.fieldKey]}}</option>\n    </select>\n\n\n    <select data-ng-disabled=\"!rule.valueKey\" data-ng-if=\"inputNeeded() && isNested()\" class=\"form-control select2\" data-ng-model=\"rule.value\">\n        <option  data-ng-repeat=\"value in rule[guide.fieldValue]\" value=\"{{value}}\">{{value}}</option>\n    </select>\n\n\n\n    <input\n    data-ng-if=\"inputPercentNeeded()\"\n    type=\"number\" data-ng-model=\"rule.matchingPercent\"\n    class=\"form-control\" placeholder=\"Seuil de matching...\">\n\n    <select\n    data-ng-if=\"inputPercentNeeded()\"\n    data-ng-model=\"rule.operator\"\n    class=\"form-control select2\">\n    <option value=\"or\">OR</option>\n    <option value=\"and\">AND</option>\n    </select>\n\n</span>\n");}]);})(window.angular);