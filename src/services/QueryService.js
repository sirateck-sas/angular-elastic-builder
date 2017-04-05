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
