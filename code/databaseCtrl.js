angular.module("mainApp").controller("databaseCtrl", function($scope, $http, $timeout, mainFactory) {
    $scope.factory = mainFactory;
    $scope.inpSortTableBy = "";
    $scope.inpIsSortingReversed = true;
    $scope.leaSortTableBy = "";
    $scope.leaIsSortingReversed = true;
    $scope.isEditingWord     = false;
    $scope.wordBeingEdited   = null;

    $scope.editWord = function(theWord) {
        // $location.hash('addWordWord');
        // $anchorScroll();
        document.getElementById("editWordWord").value = theWord.w;
        document.getElementById("editWordTranslations").value = arrayToString(theWord.tr, false);
        document.getElementById("editWordTag").value = theWord.t;

        $scope.wordBeingEdited = theWord.w;
        $scope.isEditingWord = true;
    };

    // TODO: check for empty fields!
    $scope.editWordSubmit = function() {
        for (i = 0; i < $scope.factory.wordsDatabase.inProgress.length + $scope.factory.wordsDatabase.learned.length; i++) {
            if (i < $scope.factory.wordsDatabase.inProgress.length) {
                if ($scope.factory.wordsDatabase.inProgress[i].w == $scope.wordBeingEdited) {
                    $scope.factory.wordsDatabase.inProgress[i].w = document.getElementById("editWordWord").value.toLowerCase();
                    $scope.factory.wordsDatabase.inProgress[i].tr = $scope.getArrayOfWords(document.getElementById("editWordTranslations").value.toLowerCase());
                    $scope.factory.wordsDatabase.inProgress[i].t = document.getElementById("editWordTag").value.toLowerCase();

                    $scope.factory.updateExistingTagsWith('edit', $scope.factory.wordsDatabase.inProgress[i]);
                    break;
                }
            } else {
                if ($scope.factory.wordsDatabase.learned[i - $scope.factory.wordsDatabase.inProgress.length].w == $scope.wordBeingEdited) {
                    $scope.factory.wordsDatabase.learned[i - $scope.factory.wordsDatabase.inProgress.length].w
                        = document.getElementById("editWordWord").value.toLowerCase();
                    $scope.factory.wordsDatabase.learned[i - $scope.factory.wordsDatabase.inProgress.length].tr
                        = $scope.getArrayOfWords(document.getElementById("editWordTranslations").value.toLowerCase());
                    $scope.factory.wordsDatabase.learned[i - $scope.factory.wordsDatabase.inProgress.length].t
                        = document.getElementById("editWordTag").value.toLowerCase();

                        $scope.factory.updateExistingTagsWith('edit',
                            $scope.factory.wordsDatabase.learned[i - $scope.factory.wordsDatabase.inProgress.length]);
                    break;
                }
            }
        }

        $scope.isEditingWord = false;
        $scope.flushDatabase();
    };

    $scope.editWordDiscard = function() {
        $scope.isEditingWord = false;
    };

    $scope.removeElement = function(isInProgress, wordToRemove) {
        if (isInProgress) {
            // $scope.factory.wordsDatabase.inProgress.splice(index, 1);
            $scope.deleteWordFromArray($scope.factory.wordsDatabase.inProgress, wordToRemove);
        } else {
            // $scope.factory.wordsDatabase.learned.splice(index, 1);
            $scope.deleteWordFromArray($scope.factory.wordsDatabase.learned, wordToRemove);
        }

        $scope.flushDatabase();
        $scope.factory.updateExistingTagsWith('del', wordToRemove); // must be the first action
    };

    $scope.deleteWordFromArray = function (array, wordToRemove) {
        for (i = 0; i < array.length; i++) {
            if (array[i].w == wordToRemove.w) {
                array.splice(i, 1);
            }
        }
    }

    $scope.addNewWord = function() {
        var wordId = document.getElementById('addWordWord');
        var translationId = document.getElementById('addWordTranslations');
        var tagId = document.getElementById('addWordTag');

        if (wordId.value == "" || translationId.value == "") {
            return;
        }

        var wordToPush = {
            "w" : wordId.value.toLowerCase(),
            "cc" : 0,
            "fcd" : $scope.factory.getTodaysDate(),
            "tr" : $scope.getArrayOfWords(translationId.value.toLowerCase()),
            "s" : "",
            "t" : (tagId.value == "" ? "main" : tagId.value)
        };

        $scope.factory.wordsDatabase.inProgress.push(wordToPush);

        wordId.value = "";
        translationId.value = "";
        tagId.value = "";

        $scope.flushDatabase();
        $scope.factory.updateExistingTagsWith('add', wordToPush);
    };

    $scope.flushDatabase = function () {
        $scope.factory.flushDatabase();
    };

    $scope.getArrayOfWords = function(wordsString) {
        return wordsString.split(";", 10); // Max 10 translations
    };
});
