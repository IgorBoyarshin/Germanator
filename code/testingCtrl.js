angular.module("mainApp").controller("testingCtrl", function($scope, $http, $timeout, mainFactory) {
    $scope.factory = mainFactory;
    $scope.isGermanWordGiven = true;
    $scope.usersAnswer = "";
    $scope.factory.submitButtonText = "Submit";

    // Wait for the database to load
    $timeout(function() {
        $scope.factory.currentWord = $scope.generateNewRandomTestWord();

    }, 100);

    // Use of a non-factory value
    $scope.submit = function() {
        if ($scope.factory.submitButtonText == "Submit") {
            // check and update

            var inArray;
            if ($scope.isGermanWordGiven) {
                inArray = $scope.isWordInArray($scope.usersAnswer, $scope.factory.currentWord.tr);
                // inArray = $scope.factory.isInArray($scope.usersAnswer, $scope.factory.currentWord.tr);
            } else {
                inArray = $scope.isWordCloseTo($scope.factory.currentWord.w, $scope.usersAnswer);
            }
            if (inArray == 1 || inArray == 0) { // Correct
                if (inArray == 0) { // small mistake
                    $scope.markLineAndShowCorrectAnswer($scope.factory.colorsForLine.mistake);
                } else { // perfect match
                    $scope.markLineAndShowCorrectAnswer($scope.factory.colorsForLine.correct);
                }

                if ($scope.factory.isCurrentWordInProgress) {
                    $scope.factory.currentWord.cc++;

                    if ($scope.factory.currentWord.cc == 1) {
                        $scope.factory.currentWord.fcd = $scope.factory.getTodaysDate();
                    }

                    if ($scope.factory.currentWord.cc >= $scope.factory.requiredNumberOfCorrect) { // move to Learned
                        if ($scope.daysPassed($scope.factory.getTodaysDate(), $scope.factory.currentWord.fcd) >= $scope.factory.requiredNumberOfDays) {
                            $scope.factory.moveWordToLearned($scope.factory.currentWord);
                        }
                    }
                }
            } else { // Wrong
                $scope.markLineAndShowCorrectAnswer($scope.factory.colorsForLine.wrong);

                if ($scope.factory.isCurrentWordInProgress) {
                    $scope.factory.currentWord.cc -= $scope.factory.incorrectPenalty;
                    if ($scope.factory.currentWord.cc < 0) {
                        $scope.factory.currentWord.cc = 0;
                    }
                    // $scope.factory.currentWord.fcd = $scope.factory.getTodaysDate();
                } else {
                    $scope.factory.moveWordToInProgress($scope.factory.currentWord);
                    $scope.factory.currentWord.cc = floor($scope.factory.requiredNumberOfCorrect / 2.0);
                }
            }

            // Invert submitButtonText
            $scope.factory.submitButtonText = "Next";
        } else {
            $scope.markLineAndShowCorrectAnswer($scope.factory.colorsForLine.neutral);

            // Get new word and reset answer
            $scope.factory.currentWord = $scope.generateNewRandomTestWord();
            $scope.usersAnswer = "";

            // Invert submitButtonText
            $scope.factory.submitButtonText = "Submit";

            // Flush database
            $scope.factory.testsUntilNextSave -= 1;
            if ($scope.factory.testsUntilNextSave == 0) {
                $scope.factory.testsUntilNextSave = $scope.factory.testsUntilSave;
                $scope.flushDatabase();
            }
        }

        $timeout(function() {
            // so that we don't accidently press Enter twice
        }, 500);
    };

    $scope.isWordCloseTo = function(correctWord, usedWord) {
        var lCorrect = correctWord.toLowerCase();
        var lUsed = usedWord.toLowerCase();

        if (lCorrect == lUsed) {
            return 1;
        }

        if (lCorrect.length == lUsed.length) {
            var mistakeFound = false;

            for (i = 0; i < lCorrect.length; i++) {
                if (lCorrect.charAt(i) != lUsed.charAt(i)) {
                    if (mistakeFound) {
                        return -1;
                    }

                    mistakeFound = true;
                }
            }

            if (mistakeFound) {
                return 0;
            } else {
                // can't be the case..
                console.log('OMG');
                return 1;
            }
        }

        if (lCorrect.length == lUsed.length - 1) {
            return $scope.isWordPartOf(lCorrect, lUsed);
        } else if (lCorrect.length == lUsed.length + 1) {
            return $scope.isWordPartOf(lUsed, lCorrect);
        }

        return -1;
    }

    $scope.isWordPartOf = function(subWord, word) {
        // does not work for 'order' and 'amount'

        var missFound = false;

        for (i = 1; i <= subWord.length; i++) {
            if (subWord.charAt(i-1) != word.charAt(missFound ? (i+1-1) : (i-1))) {
                if (missFound) {
                    return -1;
                }

                i--;
                missFound = true;
            }
        }

        return 0;
    };

    $scope.markLineAndShowCorrectAnswer = function (colorToMarkWith) {
        document.getElementById("buttonsContainer")
            .style.background = colorToMarkWith;

        switch (colorToMarkWith) {
            case $scope.factory.colorsForLine.wrong:
            case $scope.factory.colorsForLine.mistake:
                $scope.showCorrectAnswer = 1;
                break;
            case $scope.factory.colorsForLine.correct:
                $scope.showCorrectAnswer = (($scope.isGermanWordGiven) && ($scope.factory.currentWord.tr.length > 1)) ? 2 : 0;
                break;
            default:
                $scope.showCorrectAnswer = 0;
        }

        // $scope.showCorrectAnswer =
        //     (colorToMarkWith == $scope.factory.colorsForLine.wrong
        //         || colorToMarkWith == $scope.factory.colorsForLine.mistake
        //         || $scope.factory.currentWord.tr.length > 1) ? 1 : 0;
    };

    // 1 - perfect match; 0 - match; -1 - not found
    $scope.isWordInArray = function (word, array) {
        for (j = 0; j < array.length; j++) {
            if (array[j].toLowerCase() == word.toLowerCase()) {
                return 1;
            } else {
                if ($scope.isWordCloseTo(array[j], word) == 0) {
                    return 0;
                }
            }
        }

        return -1;
    };

    $scope.generateNewRandomTestWord = function () {
        var averager = 5;
        $scope.isGermanWordGiven = $scope.getRandomInt(0, averager * 2) % 2 == 0;

        var inProgressLength = $scope.factory.currentTagsIndexes[0].length;
        if (inProgressLength == 0) {
            return $scope.generateNewTestWord(false);
        } else {
            var learnedLength = $scope.factory.currentTagsIndexes[1].length;
            if (learnedLength == 0)  {
                return $scope.generateNewTestWord(true);
            } else {  // normal situation
                // return $scope.generateNewTestWord($scope.getRandomInt(0, 10) % 9 != 0);

                // return $scope.generateNewTestWord($scope.
                //     getRandomInt(0, averager * (inProgressLength + learnedLength)) < averager * inProgressLength);

                return $scope.generateNewTestWord($scope.
                    getRandomInt(0, $scope.factory.sqr(1 * (inProgressLength + learnedLength))) > $scope.factory.sqr(1 * learnedLength));
            }
        }
    };

    $scope.generateNewTestWord = function (isFromInProgress) {
        var word;

        if (isFromInProgress) {
            // var isLeastKnown = $scope.getRandomInt(0, 3) == 0;
            var isLeastKnown = ($scope.getRandomInt(0, 9) % 5) == 0; // 4.5
            // var isLeastKnown = false;

            if (isLeastKnown) {
                word = $scope.factory.wordsDatabase.inProgress[$scope.findLeastKnownWord()];
            } else {
                word = $scope.factory.wordsDatabase.inProgress[
                    $scope.factory.currentTagsIndexes[0][$scope.getRandomInt(0, $scope.factory.currentTagsIndexes[0].length)]];
            }
        } else {
            word = $scope.factory.wordsDatabase.learned[
                $scope.factory.currentTagsIndexes[1][$scope.getRandomInt(0, $scope.factory.currentTagsIndexes[1].length)]];
        }
        $scope.factory.isCurrentWordInProgress = isFromInProgress;

        return word;
    };

    $scope.findLeastKnownWord = function() {
        var index = $scope.factory.currentTagsIndexes[0][0];
        var correct = $scope.factory.wordsDatabase.inProgress[$scope.factory.currentTagsIndexes[0][0]].cc;

        // console.log('Will find least known');
        // console.log('currentStatus:');
        // console.log($scope.factory.currentTagsIndexes);

        for (i = 1; i < $scope.factory.currentTagsIndexes[0].length; i++) {
            // console.log('i=' + i);
            // console.log('index = ' + $scope.factory.currentTagsIndexes[0][i]);
            if ($scope.factory.wordsDatabase.inProgress[$scope.factory.currentTagsIndexes[0][i]].cc < correct) {
                correct = $scope.factory.wordsDatabase.inProgress[$scope.factory.currentTagsIndexes[0][i]].cc;
                index = $scope.factory.currentTagsIndexes[0][i];
            }
            // console.log('least: ' + $scope.factory.wordsDatabase.inProgress[index].w);
        }

        return index;
    };

    $scope.onSubmitKeyDown = function(event) {
        if (event.keyCode == 13) {
            document.getElementById('userAnswerField').blur();
            $timeout(function() {
                document.getElementById('submitButton').click();
            }, 80);
        }
    };

    document.onkeydown = function(event) {
        if ($scope.factory.submitButtonText == "Next") {
            if (event.keyCode == 13) {
                document.getElementById("submitButton").click();

                $timeout(function() {
                    document.getElementById("userAnswerField").focus();
                }, 80);
            }
        }
    };

    $scope.flushDatabase = function () {
        $scope.factory.flushDatabase();
        $scope.factory.testsUntilNextSave = $scope.factory.testsUntilSave;
    };

    $scope.arrayToStringCapitalize = function (array) {
        if (array == null) {
            return "";
        }

        str = "";

        for (i = 0; i < array.length; i++) {
            str += array[i].charAt(0).toUpperCase() + array[i].slice(1) + "; ";
        }

        if (array.length > 1) {
            str = str.substring(0, str.length - 2);
        }

        return str;
    };

    $scope.getRandomInt = function (minIncl, maxExcl) {
        return Math.floor(Math.random() * (maxExcl - minIncl)) + minIncl;
    };

    // -year- field is not being used
    $scope.daysPassed = function (dateNow, dateBefore) {
        return ($scope.getDayOfTheYear(dateNow.d, dateNow.m) - $scope.getDayOfTheYear(dateBefore.d, dateBefore.m) + 365) % 365;
    };

    $scope.getDayOfTheYear = function (date, month) {
        var day = 0;
        for (i = 1; i < month; i++) {
            day += $scope.getDaysInMonth(i);
        }
        day += date;
        return day;
    };

    $scope.getDaysInMonth = function (monthNumber) {
        switch (monthNumber) {
            case 1:
                return 31;
                break;
            case 2:
                return 28;
                break;
            case 3:
                return 31;
                break;
            case 4:
                return 30;
                break;
            case 5:
                return 31;
                break;
            case 6:
                return 30;
                break;
            case 7:
                return 31;
                break;
            case 8:
                return 31;
                break;
            case 9:
                return 30;
                break;
            case 10:
                return 31;
                break;
            case 11:
                return 30;
                break;
            case 12:
                return 31;
                break;
            default:
                return 30; // Error, actually, but hey, let's keep the ball rollin'
        }
    };
});
