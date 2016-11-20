(function(angular) {"use strict"; angular.module("angular-elastic-builder").run(["$templateCache", function($templateCache) {$templateCache.put("angular-elastic-builder/BuilderDirective.html","<div class=\"elastic-builder\">\n  <div class=\"filter-panels\">\n    <div class=\"list-group form-inline\">\n      <div\n        data-ng-repeat=\"filter in filters\"\n        data-elastic-builder-chooser=\"filter\"\n        data-elastic-fields=\"data.fields\"\n        data-on-remove=\"removeChild($index)\"\n        data-depth=\"0\"></div>\n        <div class=\"list-group-item actions\">\n        <!--   <a class=\"btn btn-xs btn-primary\" title=\"Add Rule\" data-ng-click=\"addRule()\">\n          <i class=\"fa fa-plus\"></i>\n        </a>-->\n        <a class=\"btn btn-xs btn-primary\" title=\"Add Group\" data-ng-click=\"addGroup()\">\n          <i class=\"fa fa-list\"></i>\n        </a>\n      </div>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("angular-elastic-builder/ChooserDirective.html","<div ng-if=\"item.subType != \'bool\'\"\n  class=\"list-group-item elastic-builder-chooser\"\n  data-ng-class=\"getGroupClassName()\">\n\n  <div data-ng-if=\"item.type === \'group\'\"\n    data-elastic-builder-group=\"item\"\n    data-depth=\"{{ depth }}\"\n    data-elastic-fields=\"elasticFields\"\n    data-on-remove=\"onRemove()\"></div>\n\n  <div data-ng-if=\"item.type !== \'group\'\"\n    data-elastic-builder-rule=\"item\"\n    data-elastic-fields=\"elasticFields\"\n    data-on-remove=\"onRemove()\"></div>\n\n</div>\n\n<div ng-if=\"item.subType == \'bool\'\"\n  class=\"list-group-item elastic-builder-chooser\"\n  data-ng-class=\"getGroupClassName()\">\n\n  <div data-ng-if=\"item.type === \'group\'\"\n    data-elastic-builder-group=\"item\"\n    data-depth=\"{{ depth }}\"\n    data-elastic-fields=\"elasticFields\"\n    data-on-remove=\"onRemove()\"></div>\n\n</div>\n");
$templateCache.put("angular-elastic-builder/GroupDirective.html","<div class=\"elastic-builder-group\">\n  <h5 ng-if=\"group.subType != \'bool\'\">\n    <select data-ng-model=\"group.subType\" class=\"form-control\">\n      <option value=\"must\">must</option>\n      <option value=\"must_not\">must_not</option>\n      <option value=\"should\">should</option>\n    </select>\n    Match these conditions\n  </h5>\n\n  <div\n    data-ng-repeat=\"rule in group.rules\"\n    data-elastic-builder-chooser=\"rule\"\n    data-elastic-fields=\"elasticFields\"\n    data-depth=\"{{ +depth + 1 }}\"\n    data-on-remove=\"removeChild($index)\"></div>\n\n  <div class=\"list-group-item actions\" data-ng-class=\"getGroupClassName()\">\n    <a class=\"btn btn-xs btn-primary\" title=\"Add Sub-Rule\" data-ng-click=\"addRule()\">\n      <i class=\"fa fa-plus\"></i>\n    </a>\n    <a class=\"btn btn-xs btn-primary\" title=\"Add Sub-Group\" data-ng-click=\"addGroup()\">\n      <i class=\"fa fa-list\"></i>\n    </a>\n  </div>\n\n  <a class=\"btn btn-xs btn-danger remover\" data-ng-click=\"onRemove()\">\n    <i class=\"fa fa-minus\"></i>\n  </a>\n</div>\n");
$templateCache.put("angular-elastic-builder/RuleDirective.html","<div class=\"elastic-builder-rule\">\n  <select class=\"form-control\" data-ng-model=\"rule.field\" data-ng-options=\"field as field.title for (key,field) in elasticFields track by field.name\"></select>\n\n  <span data-elastic-type=\"getType()\" data-rule=\"rule\" data-guide=\"rule.field\"></span>\n\n  <a class=\"btn btn-xs btn-danger remover\" data-ng-click=\"onRemove()\">\n    <i class=\"fa fa-minus\"></i>\n  </a>\n\n</div>\n");
$templateCache.put("angular-elastic-builder/types/Boolean.html","<span class=\"boolean-rule\">\n  Equals\n\n  <!-- This is a weird hack to make sure these are numbers -->\n  <select\n    data-ng-model=\"rule.value\"\n    class=\"form-control\"\n    data-ng-options=\"booleans.indexOf(choice) as choice for choice in booleansOrder\">\n  </select>\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Date.html","<span class=\"date-rule form-inline\">\n  <select data-ng-model=\"rule.subType\" class=\"form-control\">\n    <optgroup label=\"Exact\">\n      <option value=\"equals\">=</option>\n    </optgroup>\n    <optgroup label=\"Unbounded-range\">\n      <option value=\"lt\">&lt;</option>\n      <option value=\"lte\">&le;</option>\n      <option value=\"gt\">&gt;</option>\n      <option value=\"gte\">&ge;</option>\n    </optgroup>\n    <optgroup label=\"Bounded-range\">\n      <option value=\"last\">In the last</option>\n      <option value=\"next\">In the next</option>\n    </optgroup>\n    <optgroup label=\"Generic\">\n      <option value=\"exists\">Exists</option>\n      <option value=\"notExists\">! Exists</option>\n    </optgroup>\n  </select>\n\n  <div class=\"form-group\">\n    <div class=\"input-group\">\n      <input data-ng-if=\"inputNeeded()\"\n        type=\"text\"\n        class=\"form-control\"\n        data-uib-datepicker-popup=\"{{ rule.dateFormat }}\"\n        data-ng-model=\"rule.date\"\n        data-is-open=\"popup1.opened\"\n        data-datepicker-options=\"dateOptions\"\n        data-ng-required=\"true\"\n        data-close-text=\"Close\" />\n      <div class=\"input-group-btn\">\n        <button type=\"button\" class=\"btn btn-default\" ng-click=\"open1()\" data-ng-if=\"inputNeeded()\">\n          <i class=\"fa fa-calendar\"></i>\n        </button>\n      </div>\n    </div>\n  </div>\n\n  <span class=\"form-inline\">\n    <div class=\"form-group\">\n      <label data-ng-if=\"inputNeeded()\">Format</label>\n      <select\n        class=\"form-control\"\n        data-ng-model=\"rule.dateFormat\"\n        data-ng-if=\"inputNeeded()\"\n        ng-options=\"f for f in formats\"></select>\n    </div>\n  </span>\n\n  <span data-ng-if=\"numberNeeded()\">\n    <input type=\"number\" class=\"form-control\" data-ng-model=\"rule.value\" min=0> days\n  </span>\n\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Multi.html","<span class=\"multi-rule\">\n  <span data-ng-repeat=\"choice in guide.choices\">\n    <label class=\"checkbox\">\n      <input type=\"checkbox\" data-ng-model=\"rule.values[choice]\">\n      {{ choice }}\n    </label>\n  </span>\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Number.html","<span class=\"number-rule\">\n  <select data-ng-model=\"rule.subType\" class=\"form-control\">\n    <optgroup label=\"Numeral\">\n      <option value=\"equals\">=</option>\n      <option value=\"gt\">&gt;</option>\n      <option value=\"gte\">&ge;</option>\n      <option value=\"lt\">&lt;</option>\n      <option value=\"lte\">&le;</option>\n    </optgroup>\n\n    <optgroup label=\"Generic\">\n      <option value=\"exists\">Exists</option>\n      <option value=\"notExists\">! Exists</option>\n    </optgroup>\n  </select>\n\n  <!-- Range Fields -->\n  <input data-ng-if=\"inputNeeded()\"\n    class=\"form-control\"\n    data-ng-model=\"rule.value\"\n    type=\"number\"\n    min=\"{{ guide.minimum }}\"\n    max=\"{{ guide.maximum }}\">\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Select.html","<span class=\"select-rule\">\n  Equals to \n  <select class=\"form-control\" data-ng-model=\"rule.value\">\n      <option  data-ng-repeat=\"option in guide.options\" value=\"{{option}}\">{{option}}</option>\n  </select>\n</span>\n");
$templateCache.put("angular-elastic-builder/types/Term.html","<span class=\"elastic-term\">\n\n  <select data-ng-model=\"rule.subType\" class=\"form-control\">\n\n    <!-- Matching Options -->\n    <optgroup label=\"Matching\">\n      <option value=\"match\">Minimum Should Match (%)</option>\n      <option value=\"match_phrase\">Match Phrase (slop)</option>\n      <!-- <option value=\"notMatch\">! Match</option> -->\n    </optgroup>\n\n    <!-- Term Options -->\n    <optgroup label=\"Text\">\n      <option value=\"equals\">Equals</option>\n      <!-- <option value=\"notEquals\">! Equals</option> -->\n    </optgroup>\n\n    <!-- Generic Options -->\n    <optgroup label=\"Generic\">\n      <option value=\"exists\">Exists</option>\n      <!-- <option value=\"notExists\">! Exists</option> -->\n    </optgroup>\n\n  </select>\n  <input\n    data-ng-if=\"inputNeeded() && !isSelect() && !isNested()\"\n    class=\"form-control\"\n    data-ng-model=\"rule.value\"\n    type=\"text\">\n\n\n    <select data-ng-if=\"inputNeeded() && isSelect()\" class=\"form-control select2\" data-ng-model=\"rule.value\">\n        <option  data-ng-repeat=\"option in guide.options\" value=\"{{option}}\">{{option}}</option>\n    </select>\n\n    <select data-ng-if=\"inputNeeded() && isNested()\" ng-change=\"keyValueChanged(rule.valueKey)\" class=\"form-control select2\" data-ng-model=\"rule.valueKey\">\n        <option  data-ng-repeat=\"option in guide.options\" value=\"{{option[guide.fieldKey]}}\">{{option[guide.fieldKey]}}</option>\n    </select>\n\n\n    <select data-ng-disabled=\"!rule.valueKey\" data-ng-if=\"inputNeeded() && isNested()\" class=\"form-control select2\" data-ng-model=\"rule.value\">\n        <option  data-ng-repeat=\"value in rule[guide.fieldValue]\" value=\"{{value}}\">{{value}}</option>\n    </select>\n\n\n\n    <input\n    data-ng-if=\"inputPercentNeeded()\"\n    type=\"number\" data-ng-model=\"rule.matchingPercent\"\n    class=\"form-control\" placeholder=\"Seuil de matching...\">\n\n</span>\n");}]);})(window.angular);