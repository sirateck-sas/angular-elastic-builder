(function(angular) {

  var app = angular.module('exampleApp', [
    'angular-elastic-builder',
  ]);

  app.controller('BasicController', function() {

    var data = this.data = {};
    data.filters = [];
    data.query =
    {
        nested:{
          path: "attributes",
          query:{
            bool:
                  {
                    must:[
                            {
                              match: {
                                "title": {
                                  query: "%title%",
                                  minimum_should_match: "100%",
                                  operator: "and"
                                }
                              }
                            },
                            {
                             term: {
                               "attributes.name": "Color"
                             }
                           },
                           {
                             term: {
                               "attributes.values": "blue"
                             }
                           },
                           {
                            "term": {
                              "category": "cat1"
                            }
                          },
                          {
                            "term": {
                              "brand": "spilu"
                            }
                          },
                          {
                            "range": {
                              "price": {
                                "gte": 40
                              }
                            }
                          }
                      ],
                    }
                  }
                }
            };

    /*data.query = {
      bool:
            {
              must:[
                      {
                        match: {
                          "title": {
                            query: "%title%",
                            minimum_should_match: "100%",
                            operator: "and"
                          }
                        }
                      },
                      {
                       term: {
                         "attributes.name": "Color"
                       }
                     },
                     {
                       term: {
                         "attributes.values": "blue"
                       }
                     },
                     {
                      "term": {
                        "category": "cat1"
                      }
                    },
                    {
                      "term": {
                        "brand": "spilu"
                      }
                    },
                    {
                      "range": {
                        "price": {
                          "gte": 40
                        }
                      }
                    }
                ],
              }
            };*/

    var fields = [
     //{name:'test.number', title: 'Test Number', type: 'number', minimum: 650 },
     {name:'title', title: 'Nom', type: 'term' },
     {name:'category', title: 'Catégorie', type: 'term', options: ["cat1","cat2"]},
     {name:'attributes', title: 'Attribute', type: 'term',nested:true,fieldKey:'name',fieldValue:'values', options: [{name:'Color',values: ["blue","green",'yellow']}]},
     //{name:'attributes', title: 'Size', type: 'term',nested:true,fieldKey:'name',fieldValue:'value', options: ["S","M",'L','XL']},
     {name:'price', title: 'Prix', type: 'number' },
     {name:'brand', title: 'Marque', type: 'term'},
     {name:'sku', title: 'SKU', type: 'term' },
     {name:'ean', title: 'Ean', type: 'term' },
     {name:'isbn', title: 'Isbn', type: 'term' },
     {name:'mpn', title: 'Mpn', type: 'term' }


     /*'test.boolean': { title: 'Test Boolean', type: 'boolean' },
     'test.state.multi': { title: 'Test Multi', type: 'multi', choices: [ 'AZ', 'CA', 'CT' ]},
     'test.date': { title: 'Test Date', type: 'date' },
     'test.otherdate': { title: 'Test Other Date', type: 'date' },
     'test.match': { title: 'Test Match', type: 'match' }*/
    ];

    data.fields = fields;

    data.needsUpdate = true;

    this.showQuery = function() {
      var queryToShow = {
        size: 0,
        query: data.query
      };

      return JSON.stringify(queryToShow, null, 2);
    };

  });

})(window.angular);
