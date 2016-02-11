var app = angular.module("mainApp", ['ngRoute']);

app.filter('capitalize', function() {
    return function(input, scope) {
        if (input != null) {
            input = input.toLowerCase();
            return input.substring(0,1).toUpperCase() + input.substring(1);
        } else {
            return "";
        }
  }
});

app.filter('arrayToString', function() {
    return function(input, scope) {
        return arrayToString(input, true);
  }
});

// TODO: maybe loop through items and for each ...
app.config(function($routeProvider) {
    $routeProvider

        // route for the home page
        .when('/testing', {
            templateUrl : 'testing.html',
            controller  : 'testingCtrl'
        })

        // route for the about page
        .when('/database', {
            templateUrl : 'database.html',
            controller  : 'databaseCtrl'
        })

        // route for the contact page
        .when('/settings', {
            templateUrl : 'settings.html',
            controller  : 'settingsCtrl'
        })

        .otherwise({
            redirectTo : '/testing'
        });
});

function isCharDigit(code) {
    return (code >= 48 && code <= 57);
}

function charToDigit(c) {
    return (("" + c).charCodeAt(0) - 48);
}

function isCharRusOrUkr(code) {
    return ((code >= 1040 && code <= 1103) || code == 1030 || code == 1031
        || code == 1110 || code == 1111 || code == 1028 || code == 1108);
}

// [211..380]
function isCharPol(code) {
    return ((code >= 260 && code <= 281) || (code >= 321 && code <= 380) || code == 211 || code == 243);
}

var CONST_DEC_RUS_UKR = 1015;
var CONST_DEC_POL    = 100; // unnecessary, actually, but let it be
// :u :a :o :s
function charsInStringToEncoded(str) {
    var newStr = "";

    for (i = 0; i < str.length; i++) {
        switch(str.charAt(i)) {
            // ger
            case 'ü':
                newStr += ";u";
                break;
            case 'ä':
                newStr += ";a";
                break;
            case 'ö':
                newStr += ";o";
                break;
            case 'ß':
                newStr += ";s";
                break;

            default: { // rus and ukr
                if (isCharRusOrUkr(str.charCodeAt(i))) {
                    newStr += ";" + (str.charCodeAt(i) - CONST_DEC_RUS_UKR);
                } else if (isCharPol(str.charCodeAt(i)))  { // pol
                    newStr += ";" + (str.charCodeAt(i) - CONST_DEC_POL);
                } else { // default
                    newStr += str.charAt(i);
                }
            }
        }
    }

    return newStr;
}

// TODO: there is no check for end of str when checking :245(3 digits)
function charsInStringToNormal(str) {
    var newStr = "";

    for (i = 0; i < str.length; i++) {
        if (str.charAt(i) == ';') {
            if (i == str.length - 1) { // end of string
                newStr += ";";
            } else {
                switch (str.charAt(i + 1)) {
                    // german
                    case 'u':
                        newStr += 'ü';
                        break;
                    case 'a':
                        newStr += 'ä';
                        break;
                    case 'o':
                        newStr += 'ö';
                        break;
                    case 's':
                        newStr += 'ß';
                        break;

                    default: { // rus and ukr and pol
                        if (isCharDigit(str.charCodeAt(i + 1)) && isCharDigit(str.charCodeAt(i + 2))) {
                            if (isCharDigit(str.charCodeAt(i + 3))) { // pol
                                var code =
                                    charToDigit(str.charAt(i + 1)) * 100
                                    + charToDigit(str.charAt(i + 2)) * 10
                                    + charToDigit(str.charAt(i + 3));
                                newStr += ("" + String.fromCharCode(CONST_DEC_POL + code));

                                i++; // skip +3
                            } else { // rus and ukr
                                var code =
                                    charToDigit(str.charAt(i + 1)) * 10
                                    + charToDigit(str.charAt(i + 2));
                                newStr += ("" + String.fromCharCode(CONST_DEC_RUS_UKR + code));
                            }

                            i++; // skip +2
                        } else { // default
                            newStr += ";" + str.charAt(i + 1);
                        }
                    }
                }

                i++; // skip +1
            }
        } else {
            newStr += str.charAt(i);
        }
    }

    return newStr;
}

function arrayToString(array, bPutSpace) {
    str = "";

    for (i = 0; i < array.length; i++) {
        str += array[i] + (bPutSpace ? "; " : ";");
    }

    if (array.length > 0) {
        str = str.substring(0, str.length - (bPutSpace ? 2 : 1));
    }

    return str;
}

/*

{
    "inProgress":
    [
        {
            "w" : "",
            "cc" : 0,
            "fcd" : {
                "y" : 2015,
                "m" : 10,
                "d" : 11
            },
            "tr" : ["", ""],
            "s" : [""],
            "t" : "duo"
        }
    ],

    "learned":
    [
        "w" : "",
        "tr" : [""],
        "s" : [""],
        "t" : ""
    ]
}

*/

app.factory("mainFactory", function($http) {
    var factory = {};

    factory.navigationElements      = ["testing", "database", "settings"];
    factory.wordsDatabase           = null;
    factory.currentWord             = null;
    factory.isCurrentWordInProgress = true;
    factory.submitButtonText        = "Submit"; // TODO:  move to scope
    factory.colorsForLine           = {
        neutral : "#33A",
        correct : "rgba(0, 255, 0, 0.5)",
        wrong   : "rgba(255, 0, 0, 0.5)",
        mistake : "rgba(210, 210, 0, 0.7)"
    };
    factory.testsUntilSave          = 25; // 25 flush every .. tests
    factory.testsUntilNextSave      = factory.testsUntilSave;
    factory.requiredNumberOfCorrect = 30;
    factory.incorrectPenalty        = 5;
    factory.requiredNumberOfDays    = 14;
    factory.currentTagsIndexes      = [[], []]; // for inProgress and learned
    factory.existingTags            = [];
    factory.mainLangMark            = "ger";
    factory.secondaryLangMark       = "eng";

    // [
    //     {
    //         "name" : "tag1",
    //         "used" : true,
    //         --"amount" : [3, 5],
    //         "indices" : [[1,4,8], [2,3,5,6,7]] // inProgress and learned
    //     }
    // ]
    factory.setExistingTags = function() {
        factory.existingTags = []; // reset previous

        for (j = 0; j < factory.wordsDatabase.inProgress.length + factory.wordsDatabase.learned.length; j++) {
            var tag = "";
            var index = -1;
            var inProgress;
            if (j < factory.wordsDatabase.inProgress.length) {
                tag = factory.wordsDatabase.inProgress[j].t;
                index = j;
                inProgress = true;
            } else {
                tag = factory.wordsDatabase.learned[j - factory.wordsDatabase.inProgress.length].t;
                index = j - factory.wordsDatabase.inProgress.length;
                inProgress = false;
            }

            var indexInArray = factory.getIndexOfTagInExistingTags(tag);
            if (indexInArray == -1) {
                factory.existingTags.push({
                    "name" : tag,
                    "used" : true,
                    // "amount" : (inProgress ? [1, 0] : [0, 1]),
                    "indices" : (inProgress ? [[index], []] : [[], [index]])
                });
            } else {
                // factory.existingTags[indexInArray].amount[(inProgress ? 0 : 1)]++;
                factory.existingTags[indexInArray].indices[(inProgress ? 0 : 1)].push(index);
            }
        }
    };

    // action: 'del', 'add', 'edit'
    factory.updateExistingTagsWith = function(action, theWord) {
        switch (action) {
            case "add": {
                var index = factory.getIndexOfTagInExistingTags(theWord.t);
                if (index == -1) {
                    factory.existingTags.push({
                        "name" : theWord.t,
                        "used" : true,
                        // "amount" : [1, 0], // a new word is always in inProgress
                        "indices" : [[factory.getIndexOfWordInDatabase(theWord.w)], []]
                    });
                } else {
                    // factory.existingTags[index].amount[0]++;
                    factory.existingTags[index].indices[0].push(factory.getIndexOfWordInDatabase(theWord.w));
                }

                factory.setCurrentTagsIndices();
                break;
            }
            case "del":
            case "edit": {
                var previousChecked = [];
                for (i = 0; i < factory.existingTags.length; i++) {
                    if (factory.existingTags[i].used) {
                        previousChecked.push(factory.existingTags[i].name);
                    }
                }
                factory.setExistingTags();
                for (i = 0; i < factory.existingTags.length; i++) {
                    var found = false;
                    for (j = 0; j < previousChecked.length; j++) {
                        if (previousChecked[j] == factory.existingTags[i].name) {
                            // factory.existingTags[i].used = true;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        factory.existingTags[i].used = false;
                    } // it is already set to true, no 'else' needed
                }
                factory.setCurrentTagsIndices();
                break;
            }
        }
    };

    factory.moveWordToLearned = function(theWord) {
        var tagIndex = factory.getIndexOfTagInExistingTags(theWord.t);

        var oldWordIndex = factory.getIndexOfWordInDatabase(theWord.w);
        factory.wordsDatabase.learned.push(
            {
                "w" : theWord.w,
                "tr" : theWord.tr,
                "s" : theWord.s,
                "t" : theWord.t
            }
        );
        factory.wordsDatabase.inProgress.splice(oldWordIndex, 1);
        factory.isCurrentWordInProgress = false;
        var newWordIndex = factory.getIndexOfWordInDatabase(theWord.w) - factory.wordsDatabase.inProgress.length;

        if (factory.existingTags[tagIndex].used) {
            var indexInCurrentTags = factory.getIndexInArray(oldWordIndex, factory.currentTagsIndexes[0]);
            factory.currentTagsIndexes[0].splice(indexInCurrentTags, 1);
            factory.currentTagsIndexes[1].push(newWordIndex);

            // We need to do this because after deleting an element
            // indices higher than the old one will be wrong due to
            // reduced length of the array. We need to shift them
            for (c = 0; c < factory.currentTagsIndexes[0].length; c++) {
                if (factory.currentTagsIndexes[0][c] > oldWordIndex) {
                    factory.currentTagsIndexes[0][c]--;
                }
            }
        }

        var indexOfWordIndex = factory.getIndexInArray(oldWordIndex, factory.existingTags[tagIndex].indices[0]);
        factory.existingTags[tagIndex].indices[0].splice(indexOfWordIndex, 1);
        factory.existingTags[tagIndex].indices[1].push(newWordIndex);

        // Same situation as above
        for (c = 0; c < factory.existingTags[tagIndex].indices[0].length; c++) {
            if (factory.existingTags[tagIndex].indices[0][c] > oldWordIndex) {
                factory.existingTags[tagIndex].indices[0][c]--;
            }
        }
    };

    factory.moveWordToInProgress = function(theWord) {
        var tagIndex = factory.getIndexOfTagInExistingTags(theWord.t);

        var oldWordIndex = factory.getIndexOfWordInDatabase(theWord.w) - factory.wordsDatabase.inProgress.length;
        factory.wordsDatabase.inProgress.push(
            {
                "w" : wordToMove.w,
                "cc" : 0,
                "fcd" : factory.getTodaysDate(),
                "tr" : wordToMove.tr,
                "s" : wordToMove.s,
                "t" : wordToMove.t
            }
        );
        factory.wordsDatabase.learned.splice(oldWordIndex, 1);
        factory.isCurrentWordInProgress = true;
        var newWordIndex = factory.getIndexOfWordInDatabase(theWord.w);

        if (factory.existingTags[tagIndex].used) {
            var indexInCurrentTags = factory.getIndexInArray(oldWordIndex, factory.currentTagsIndexes[1]);
            factory.currentTagsIndexes[1].splice(indexInCurrentTags, 1);
            factory.currentTagsIndexes[0].push(newWordIndex);

            // Read above
            for (c = 0; c < factory.currentTagsIndexes[1].length; c++) {
                if (factory.currentTagsIndexes[1][c] > oldWordIndex) {
                    factory.currentTagsIndexes[1][c]--;
                }
            }
        }

        var indexOfWordIndex = factory.getIndexInArray(oldWordIndex, factory.existingTags[tagIndex].indices[1]);
        factory.existingTags[tagIndex].indices[1].splice(indexOfWordIndex, 1);
        factory.existingTags[tagIndex].indices[0].push(newWordIndex);

        // Read above
        for (c = 0; c < factory.existingTags[tagIndex].indices[1].length; c++) {
            if (factory.existingTags[tagIndex].indices[1][c] > oldWordIndex) {
                factory.existingTags[tagIndex].indices[1][c]--;
            }
        }
    };

    factory.setCurrentTagsIndices = function() {
        factory.currentTagsIndexes = [[], []]; // reset previous

        for (i = 0; i < factory.existingTags.length; i++) {
            if (factory.existingTags[i].used) {
                // factory.currentTagsIndexes = [
                //     factory.currentTagsIndexes[0].concat(factory.existingTags[i].indices[0]),
                //     factory.currentTagsIndexes[1].concat(factory.existingTags[i].indices[1])
                // ];
                factory.currentTagsIndexes[0].push.apply(factory.currentTagsIndexes[0], factory.existingTags[i].indices[0]);
                factory.currentTagsIndexes[1].push.apply(factory.currentTagsIndexes[1], factory.existingTags[i].indices[1]);
            }
        }

        // console.log(factory.currentTagsIndexes[0]);
        // console.log(factory.currentTagsIndexes[1]);
    };

    factory.getIndexOfWordInDatabase = function(theWord) {
        for (i = 0; i < factory.wordsDatabase.inProgress.length + factory.wordsDatabase.learned.length; i++) {
            if (i < factory.wordsDatabase.inProgress.length) {
                if (factory.wordsDatabase.inProgress[i].w == theWord) {
                    return i;
                }
            } else {
                if (factory.wordsDatabase.learned[i - factory.wordsDatabase.inProgress.length].w == theWord) {
                    // return (i - factory.wordsDatabase.inProgress.length);
                    return i;
                }
            }
        }

        return -1;
    };

    factory.getIndexOfTagInExistingTags = function(tag) {
        for (i = 0; i < factory.existingTags.length; i++) {
            if (factory.existingTags[i].name == tag) {
                return i;
            }
        }

        return -1;
    };

    factory.getIndexInArray = function(element, array) {
        for (i = 0; i < array.length; i++) {
            if (array[i] == element) {
                return i;
            }
        }

        return -1;
    };

    // is tag in existingTags
    factory.isInArray = function(element, array) {
        for (i = 0; i < array.length; i++) {
            if (array[i] == element) {
                return true;
            }
        }

        return false;
    };


    factory.sqr = function(arg) {
        return arg * arg;
    }

    factory.getTodaysDate = function () {
        var date = new Date(); // mb get it only once?..
        return {"y" : 1900 + date.getYear(), "m" : (date.getMonth() + 1), "d" : date.getDate()};
    };

    factory.flushDatabase = function() {
        $http.post('../database/words.json',
            angular.fromJson(charsInStringToEncoded(angular.toJson(factory.wordsDatabase)))).then(function(data) {
                  // Log 'Save complete'
                });
    };

    // Load database
    $http.get('../database/words.json')
        .success(function(data, status, headers, config) {
            // factory.wordsDatabase = data;
            var strData = angular.toJson(data);
            factory.wordsDatabase = angular.fromJson(charsInStringToNormal(strData));

            factory.setExistingTags();
            factory.setCurrentTagsIndices();
        })
        .error(function(data, status, headers, config) {

        });

    return factory;
});

// $scope.uppercaseIfNoun = function(str) {
//     var newStr = "";
//
//     for (i = 0; i < str.length - 4; i++) {
//         if (str.charAt(i).toLowerCase() == 'd') {
//             switch(str.substring(i, i + 4)) {
//                 case "dir ":
//                 case "die ":
//                 case "das ":
//                     newStr += str.substring(i, i + 4) + str.charAt(i + 4).toUpperCase();
//                     break;
//                 default:
//                     newStr += str.substring(i, i + 4) + str.charAt(i + 4);
//                     break;
//             }
//         } else {
//             newStr += str.charAt(i);
//         }
//     }
//
//     return newStr;
// }
